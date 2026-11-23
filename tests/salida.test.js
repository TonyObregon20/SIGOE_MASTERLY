import test from "node:test";
import { memory as memoryDb } from "./helpers/memoryDb.js";
import assert from "node:assert/strict";
import { createSalidaService } from "../backend/services/salidaService.js";
import { validateGuidePhoto, validateGuideNumber, MAX_GUIDE_PHOTO_BYTES, movementSummary } from "../backend/utils/guideValidation.js";
import { validateGuideFields } from "../frontend/src/features/warehouse/guideUtils.js";

// A real 1x1 PNG fixture. No server or database connection is started.
const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=";
const item = { productId: "P1", productName: "Polo", selectedSize: "M", quantity: 2 };
const order = { id: "O1", type: "direct", status: "Pagado Total", warehouseGuideVersion: 1, items: [item] };
const draft = { id: "S-draft", type: "Salida", originType: "Venta Directa", status: "Pendiente", orderId: "O1", guideVersion: 1, automaticDraft: true, items: [item] };
const payload = (extra = {}) => ({ orderId: "O1", guideMode: "CON_GUIA", guideNumber: "GR-0012", guidePhoto: photo, requestId: "request-0001", autoAccept: true, ...extra });

const memory = (seed = {}) => memoryDb({ Movement: [draft], Order: [order], ...seed });

async function rejectsWithoutChanges(db, work, pattern) {
  const before = db.snapshot();
  await assert.rejects(work, pattern);
  assert.deepEqual(db.snapshot(), before);
}

test("registration requires explicit mode, number, photo and boolean autoAccept before writing", async () => {
  for (const bad of [{ guideMode: undefined }, { guideNumber: "" }, { guidePhoto: undefined }, { guidePhoto: "data:image/svg+xml;base64,PHN2Zz4=" }, { autoAccept: "false" }]) {
    const db = memory();
    await rejectsWithoutChanges(db, () => db.service.create(payload(bad)), /guía|fotografía|autoAccept|GUÍA/);
  }
});

test("direct sale reuses automatic draft, hides evidence, and applies stock once", async () => {
  const db = memory();
  const result = await db.service.create(payload());
  assert.equal(result.id, "S-draft");
  assert.equal(result.status, "Aceptado");
  assert.equal(result.guidePhoto, undefined);
  assert.equal(db.snapshot().Movement.length, 1);
  assert.equal(db.snapshot().Movement[0].guidePhoto, photo);
  assert.equal(db.snapshot().Product[0].stockPhysical, 8);
  assert.equal(db.snapshot().Product[0].sizes.M.stockPhysical, 8);
  assert.equal(db.snapshot().Kardex.length, 1);
  const beforeRetry = db.snapshot();
  await db.service.create(payload());
  await db.service.accept(result.id);
  assert.deepEqual(db.snapshot(), beforeRetry);
  assert.equal(db.snapshot().Product[0].stockPhysical, 8);
  assert.equal(db.snapshot().Kardex.length, 1);
});

test("CON GUIA cannot be downgraded or duplicated with another request", async () => {
  const db = memory();
  await db.service.create(payload({ autoAccept: false }));
  await rejectsWithoutChanges(db, () => db.service.create(payload({ requestId: "request-0002", guideMode: "SIN_GUIA" })), /Ya existe/);
  await rejectsWithoutChanges(db, () => db.service.create(payload({ guideMode: "SIN_GUIA" })), /identificador/);
});

test("pending acceptance validates stored evidence; modern unconfigured draft is blocked", async () => {
  const db = memory();
  await rejectsWithoutChanges(db, () => db.service.accept("S-draft"), /Seleccione/);
  await db.service.create(payload({ autoAccept: false }));
  assert.equal(db.snapshot().Kardex.length, 0);
  await db.service.accept("S-draft");
  assert.equal(db.snapshot().Kardex.length, 1);
  const corrupt = memory({ Movement: [{ ...draft, guideMode: "CON_GUIA", guideNumber: "GR-0012" }] });
  await rejectsWithoutChanges(corrupt, () => corrupt.service.accept("S-draft"), /fotografía/);
});

test("exact mismatch, missing/invalid dispatch evidence leave ALL state unchanged", async () => {
  const db = memory();
  await db.service.create(payload());
  for (const wrong of ["GR-012", "gr-0012", " GR-0012", "GR-0012 ", 12, undefined]) {
    await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1", movementId: "S-draft", guideNumber: wrong, guidePhoto: photo }), /guía/);
  }
  await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1", movementId: "S-draft", guideNumber: "GR-0012" }), /fotografía/);
  await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1" }), /guía/);
});

test("guided shipping saves second evidence without a second stock deduction; retry is idempotent", async () => {
  const db = memory();
  await db.service.create(payload());
  const evidence = { orderId: "O1", movementId: "S-draft", guideNumber: "GR-0012", guidePhoto: photo };
  const shipped = await db.service.ship(evidence);
  assert.equal(shipped.status, "Enviado");
  const after = db.snapshot();
  assert.equal(after.Movement[0].dispatchGuidePhoto, photo);
  assert.equal(after.Movement[0].dispatchGuideNumber, "GR-0012");
  assert.equal(after.Product[0].stockPhysical, 8);
  assert.equal(after.Kardex.length, 1);
  await db.service.ship(evidence);
  assert.deepEqual(db.snapshot(), after);
});

test("a historical accepted SIN GUIA movement cannot mask a pending guided movement", async () => {
  const db = memory({ Movement: [draft, { ...draft, id: "S-old", status: "Aceptado", guideVersion: undefined }] });
  await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1", movementId: "S-old" }), /Seleccione/);
  const guided = { ...draft, guideMode: "CON_GUIA", guideNumber: "GR-0012", guidePhoto: photo };
  const other = memory({ Movement: [guided, { ...draft, id: "S-old", status: "Aceptado", guideVersion: undefined }] });
  await rejectsWithoutChanges(other, () => other.service.ship({ orderId: "O1", movementId: "S-old" }), /guía/);
  await rejectsWithoutChanges(other, () => other.service.ship({ orderId: "O1", movementId: "S-draft", guideNumber: "GR-0012", guidePhoto: photo }), /aprobada/);
});

test("every guided partial movement must be confirmed, even when selecting a different movement", async () => {
  const guided = { ...draft, status: "Aceptado", guideMode: "CON_GUIA", guideNumber: "GR-0012", guidePhoto: photo };
  const db = memory({ Movement: [guided, { ...guided, id: "S-second", guideNumber: "GR-0013" }] });
  await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1", movementId: "S-draft", guideNumber: "GR-0012", guidePhoto: photo }), /guía/);
  const guides = [{ movementId: "S-draft", guideNumber: "GR-0012", guidePhoto: photo }, { movementId: "S-second", guideNumber: "GR-0013", guidePhoto: photo }];
  await db.service.ship({ orderId: "O1", guides });
  assert.equal(db.snapshot().Order[0].status, "Enviado");
});

test("SIN GUIA remains usable without either photograph", async () => {
  const db = memory();
  await db.service.create(payload({ guideMode: "SIN_GUIA", guidePhoto: undefined, guideNumber: undefined }));
  await db.service.ship({ orderId: "O1" });
  assert.equal(db.snapshot().Order[0].status, "Enviado");
  assert.equal(db.snapshot().Kardex.length, 1);
});

test("historical records retain approval and shipping without retroactive evidence", async () => {
  const legacyOrder = { ...order, warehouseGuideVersion: undefined };
  const legacyDraft = { ...draft, guideVersion: undefined };
  for (const movements of [[legacyDraft], []]) {
    const db = memory({ Order: [legacyOrder], Movement: movements });
    await db.service.ship({ orderId: "O1" });
    assert.equal(db.snapshot().Order[0].status, "Enviado");
    assert.equal(db.snapshot().Movement.length, 1);
    assert.equal(db.snapshot().Kardex.length, 1);
    await db.service.ship({ orderId: "O1" });
    assert.equal(db.snapshot().Kardex.length, 1);
  }
});

test("modern orders cannot use historical shipping fallback", async () => {
  const db = memory({ Movement: [] });
  await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1" }), /Genere y apruebe/);
});

test("pedido derives available items from accepted ingress and uses the same guided dispatch validation", async () => {
  const db = memory({ Order: [{ ...order, type: "pedido" }], Movement: [{ id: "I-1", type: "Ingreso", status: "Aceptado", orderId: "O1", opId: "OP-1", items: [item] }], ProductionOrder: [{ id: "OP-1", orderId: "O1", items: [item] }] });
  const movement = await db.service.create(payload());
  assert.equal(movement.originType, "A Pedido");
  assert.deepEqual(movement.items, [item]);
  await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1", movementId: movement.id, guideNumber: "wrong", guidePhoto: photo }), /no coincide/);
  await db.service.ship({ orderId: "O1", movementId: movement.id, guideNumber: "GR-0012", guidePhoto: photo });
  assert.equal(db.snapshot().Kardex.length, 1);
});

test("pedido cannot release more items than it received", async () => {
  const db = memory({ Order: [{ ...order, type: "pedido" }], Movement: [{ id: "I-1", type: "Ingreso", status: "Aceptado", orderId: "O1", items: [item] }] });
  await rejectsWithoutChanges(db, () => db.service.create(payload({ items: [{ ...item, quantity: 3 }] })), /supera/);
});

test("transaction rolls back inventory, approval and evidence on ledger failure", async () => {
  const db = memory();
  db.failLedger();
  await rejectsWithoutChanges(db, () => db.service.create(payload()), /Simulated/);
});

test("concurrent create/accept/ship retries do not duplicate stock or movements", async () => {
  const db = memory();
  const creations = await Promise.all([db.service.create(payload()), db.service.create(payload())]);
  assert.equal(creations[0].id, creations[1].id);
  await Promise.all([db.service.accept("S-draft"), db.service.accept("S-draft")]);
  const evidence = { orderId: "O1", movementId: "S-draft", guideNumber: "GR-0012", guidePhoto: photo };
  await Promise.all([db.service.ship(evidence), db.service.ship(evidence)]);
  assert.equal(db.snapshot().Movement.length, 1);
  assert.equal(db.snapshot().Kardex.length, 1);
  assert.equal(db.snapshot().Product[0].stockPhysical, 8);
});

test("photo MIME, signature, encoding and size are checked server-side; photos are removed from summaries", async () => {
  assert.equal(await validateGuidePhoto(photo), photo);
  for (const value of ["https://example.com/a.png", "data:image/png;base64,YWJjZA==", "data:image/png;base64,not-base64", `data:image/jpeg;base64,${Buffer.alloc(MAX_GUIDE_PHOTO_BYTES + 1).toString("base64")}`]) await assert.rejects(() => validateGuidePhoto(value), /fotografía/);
  assert.deepEqual(movementSummary({ id: "S", guidePhoto: photo, dispatchGuidePhoto: photo }), { id: "S" });
});

test("frontend and backend preserve guide numbers without normalization", () => {
  for (const number of ["GR-0012", "00012", "gr-0012", "GR 0012"]) {
    assert.equal(validateGuideNumber(number), number);
    assert.doesNotThrow(() => validateGuideFields(number, photo));
  }
  for (const number of ["", " GR-0012", "GR-0012 ", "GR\n0012"]) {
    assert.throws(() => validateGuideNumber(number));
    assert.throws(() => validateGuideFields(number, photo));
  }
});

test("accepting a second pending movement cannot deduct stock for the same order twice", async () => {
  const legacy = { ...draft, guideVersion: undefined };
  const db = memory({ Movement: [legacy, { ...legacy, id: "S-duplicate" }] });
  await db.service.accept("S-draft");
  await rejectsWithoutChanges(db, () => db.service.accept("S-duplicate"), /otra salida aprobada/);
  assert.equal(db.snapshot().Kardex.length, 1);
});

test("invalid identifiers and malformed guide arrays fail without writes", async () => {
  const db = memory();
  await rejectsWithoutChanges(db, () => db.service.create(payload({ orderId: { $ne: null } })), /no válido/);
  await rejectsWithoutChanges(db, () => db.service.accept({ $ne: null }), /no válido/);
  await rejectsWithoutChanges(db, () => db.service.ship({ orderId: "O1", guides: "invalid" }), /lista válida/);
});


test("real pixel decoding accepts JPG PNG WebP and rejects corrupt payloads with valid containers", async () => {
  const { default: sharp } = await import("sharp");
  for (const format of ["jpeg", "png", "webp"]) {
    const bytes = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).toFormat(format).toBuffer();
    const url = (b) => `data:image/${format};base64,${b.toString("base64")}`;
    assert.equal(await validateGuidePhoto(url(bytes)), url(bytes));
    const corrupt = Buffer.from(bytes);
    if (format === "png") {
      let offset = 8;
      while (offset + 12 <= corrupt.length) {
        const size = corrupt.readUInt32BE(offset);
        if (corrupt.toString("ascii", offset + 4, offset + 8) === "IDAT") corrupt.fill(0, offset + 8, offset + 8 + size);
        offset += size + 12;
      }
    } else if (format === "jpeg") {
      const scan = corrupt.indexOf(Buffer.from([255, 218]));
      const start = scan + 2 + corrupt.readUInt16BE(scan + 2);
      corrupt.fill(255, start, corrupt.length - 2);
    } else corrupt.fill(0, 20);
    await assert.rejects(() => validateGuidePhoto(url(corrupt)), /fotografía/);
    await assert.rejects(() => validateGuidePhoto(url(bytes.subarray(0, bytes.length - 5))), /fotografía/);
    const wrong = `data:image/${format === "png" ? "jpeg" : "png"};base64,${bytes.toString("base64")}`;
    await assert.rejects(() => validateGuidePhoto(wrong), /fotografía/);
  }
});

test("manual and historical pending movements retain IDs and quantities", async () => {
  for (const extra of [{ automaticDraft: false }, { automaticDraft: undefined, guideVersion: undefined }]) {
    const existing = { ...draft, ...extra, id: "S-manual", items: [{ ...item, quantity: 7 }] };
    const db = memory({ Movement: [existing] });
    await rejectsWithoutChanges(db, () => db.service.create(payload()), /pendiente/);
    assert.deepEqual(db.snapshot().Movement, [existing]);
  }
});

test("OP-only consecutive partial releases consume only remaining balance and replay safely", async () => {
  for (const guideMode of ["CON_GUIA", "SIN_GUIA"]) {
    const db = memory({ Order: [], Movement: [{ id: "I-op", type: "Ingreso", status: "Aceptado", opId: "OP1", items: [{ ...item, quantity: 5 }] }], ProductionOrder: [{ id: "OP1", items: [{ ...item, quantityOrdered: 5 }] }] });
    const first = payload({ orderId: undefined, opId: "OP1", guideMode, requestId: "partial-first", items: [item] });
    const second = { ...first, requestId: "partial-second", items: [{ ...item, quantity: 3 }] };
    await db.service.create(first);
    const beforeRetry = db.snapshot();
    await db.service.create(first);
    assert.deepEqual(db.snapshot(), beforeRetry);
    await rejectsWithoutChanges(db, () => db.service.create({ ...first, items: [{ ...item, quantity: 3 }] }), /identificador/);
    await db.service.create(second);
    await rejectsWithoutChanges(db, () => db.service.create({ ...first, requestId: "partial-excess" }), /supera/);
    assert.equal(db.snapshot().Product[0].stockPhysical, 5);
    assert.equal(db.snapshot().Kardex.length, 2);
    assert.deepEqual(db.snapshot().Movement.filter((m) => m.type === "Salida").map((m) => m.items[0].quantity), [2, 3]);
  }
});

test("stale historical size totals are not silently allocated or deducted", async () => {
  const db = memory({ Product: [{ id: "P1", stockPhysical: 10, sizes: { M: { stockPhysical: 0 } } }] });
  await rejectsWithoutChanges(db, () => db.service.create(payload()), /conciliación/);
});
