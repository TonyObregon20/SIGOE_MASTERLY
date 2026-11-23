import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import UserModel from "../backend/models/User.js";
import jwt from "jsonwebtoken";
const testUser = { id: "req9-admin", name: "Test Admin", role: "admin" };
const token = jwt.sign(testUser, process.env.JWT_SECRET);
import warehouseRoutes from "../backend/routes/warehouseRoutes.js";
import orderRoutes from "../backend/routes/orderRoutes.js";
import Movement from "../backend/models/WarehouseMovement.js";
import OrderModel from "../backend/models/Order.js";
import ProductModel from "../backend/models/Product.js";
import InvoiceModel from "../backend/models/Invoice.js";
import { salidaService } from "../backend/services/salidaService.js";
import { memory } from "./helpers/memoryDb.js";

const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=";
const item = { productId: "P1", productName: "Polo", quantity: 2, selectedSize: "M" };
const order = { id: "O1", type: "direct", status: "Pagado Total", warehouseGuideVersion: 1, items: [item], userId: "req9-admin" };
const draft = { id: "S-draft", type: "Salida", originType: "Venta Directa", status: "Pendiente", orderId: "O1", guideVersion: 1, automaticDraft: true, items: [item] };
const registration = { orderId: "O1", requestId: "request-route", guideMode: "CON_GUIA", guideNumber: "GR-0012", guidePhoto: photo, autoAccept: true };
function invoke(router, url, body, method = "POST") {
  return new Promise((resolve, reject) => {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { resolve({ status: this.statusCode, data }); } };
    router.handle({ method, url, body, headers: { authorization: `Bearer ${token}` } }, response, (error) => error ? reject(error) : reject(new Error("Route did not handle request")));
  });
}
async function isolated(work, seed = {}) {
  assert.equal(mongoose.connection.readyState, 0);
  const db = memory({ Order: [order], Movement: [draft], ...seed });
  const methods = { ...salidaService };
  const originalUserFind = UserModel.findOne;
  UserModel.findOne = async () => testUser;
  const originalFind = Movement.find;
  const originalFindOne = Movement.findOne;
  const originalOrderFind = OrderModel.find;
  const originalProductFind = ProductModel.find;
  OrderModel.find = db.models.Order.find;
  ProductModel.find = db.models.Product.find;
  Object.assign(salidaService, db.service);
  Movement.find = db.models.Movement.find;
  Movement.findOne = db.models.Movement.findOne;
  try { await work(db); }
  finally { UserModel.findOne = originalUserFind; Object.assign(salidaService, methods); Movement.find = originalFind; Movement.findOne = originalFindOne; OrderModel.find = originalOrderFind; ProductModel.find = originalProductFind; }
  assert.equal(mongoose.connection.readyState, 0);
}

test("real create-salida -> orders/ship routes enforce exact matching before changing state", () => isolated(async (db) => {
  const created = await invoke(warehouseRoutes, "/warehouse-movements/create-salida", registration);
  assert.equal(created.data.movement.id, "S-draft");
  assert.equal(created.data.movement.guidePhoto, undefined);
  const before = db.snapshot();
  await assert.rejects(() => invoke(orderRoutes, "/orders/ship", { orderId: "O1", movementId: "S-draft", guideNumber: "wrong", guidePhoto: photo }), /no coincide/);
  assert.deepEqual(db.snapshot(), before);
  const shipped = await invoke(orderRoutes, "/orders/ship", { orderId: "O1", movementId: "S-draft", guideNumber: "GR-0012", guidePhoto: photo });
  assert.equal(shipped.data.order.status, "Enviado");
  assert.equal(db.snapshot().Kardex.length, 1);
}));

test("real accept route blocks unconfigured drafts and validates stored registration", () => isolated(async (db) => {
  const before = db.snapshot();
  await assert.rejects(() => invoke(warehouseRoutes, "/warehouse-movements/accept", { movementId: "S-draft", guideMode: "SIN_GUIA" }), /Seleccione/);
  assert.deepEqual(db.snapshot(), before);
  await invoke(warehouseRoutes, "/warehouse-movements/create-salida", { ...registration, autoAccept: false });
  await invoke(warehouseRoutes, "/warehouse-movements/accept", { movementId: "S-draft" });
  await invoke(warehouseRoutes, "/warehouse-movements/accept", { movementId: "S-draft" });
  assert.equal(db.snapshot().Kardex.length, 1);
  await assert.rejects(() => invoke(orderRoutes, "/orders/ship", { orderId: "O1", guideMode: "SIN_GUIA" }), /guía/);
}));

test("real list route strips both photos and does not create historical movements", () => isolated(async (db) => {
  await invoke(warehouseRoutes, "/warehouse-movements/create-salida", registration);
  await invoke(orderRoutes, "/orders/ship", { orderId: "O1", movementId: "S-draft", guideNumber: "GR-0012", guidePhoto: photo });
  const before = db.snapshot();
  const response = await invoke(warehouseRoutes, "/warehouse-movements", undefined, "GET");
  assert.equal(response.data.length, 1);
  assert.equal(response.data[0].guidePhoto, undefined);
  assert.equal(response.data[0].dispatchGuidePhoto, undefined);
  assert.deepEqual(db.snapshot(), before);
}));

test("real checkout route cannot forge a shipped order", () => isolated(async (db) => {
  const before = db.snapshot();
  await assert.rejects(() => invoke(orderRoutes, "/orders", { order: { ...order, status: "Enviado" } }), /no puede crearse/);
  assert.deepEqual(db.snapshot(), before);
}));

test("Mongoose schema hides evidence by default and preserves dynamic fields", () => {
  assert.equal(Movement.schema.path("guidePhoto").options.select, false);
  assert.equal(Movement.schema.path("dispatchGuidePhoto").options.select, false);
  assert.equal(Movement.schema.options.strict, false);
  const legacy = new Movement({ type: "Salida", originType: "Venta Directa", customLegacyField: "preserved", items: [{ productId: "P1", custom: true }] });
  assert.equal(legacy.guideVersion, undefined);
  assert.equal(legacy.toObject().customLegacyField, "preserved");
  assert.equal(legacy.items[0].custom, true);
});

test("real checkout creates a policy-marked draft and ignores forged warehouse metadata", () => isolated(async (db) => {
  const originals = { movementCreate: Movement.create, orderCreate: OrderModel.create, productFind: ProductModel.findOne, productUpdate: ProductModel.findOneAndUpdate, invoiceCreate: InvoiceModel.create, exists: OrderModel.exists, productsFind: ProductModel.find };
  OrderModel.exists = async () => false;
  ProductModel.find = () => ({ lean: async () => [{ id: "P1", name: "Polo", price: 30, stockPhysical: 10, stockCommitted: 2 }] });
  Movement.create = async (row) => (await db.models.Movement.create([row]))[0];
  OrderModel.create = async (row) => (await db.models.Order.create([row]))[0];
  ProductModel.findOne = db.models.Product.findOne;
  ProductModel.findOneAndUpdate = (filter, update) => db.models.Product.findOneAndUpdate({ id: filter.id }, update);
  InvoiceModel.create = async (row) => row;
  try {
    const response = await invoke(orderRoutes, "/orders", { order: { ...order, total: 60, warehouseGuideVersion: undefined, warehouseApproved: true, warehouseSalidaId: "forged", guidePhoto: photo, shippedAt: "forged" } });
    assert.equal(response.status, 200, JSON.stringify(response.data));
    assert.equal(response.data.order.warehouseGuideVersion, 1);
    assert.equal(response.data.order.warehouseApproved, undefined);
    assert.equal(response.data.order.shippedAt, undefined);
    assert.equal(response.data.order.guidePhoto, undefined);
    const createdDraft = db.snapshot().Movement[0];
    assert.equal(createdDraft.guideVersion, 1);
    assert.equal(createdDraft.automaticDraft, true);
    assert.equal(createdDraft.guideMode, undefined);
    const before = db.snapshot();
    await assert.rejects(() => invoke(orderRoutes, "/orders/ship", { orderId: "O1" }), /Seleccione/);
    assert.deepEqual(db.snapshot(), before);
  } finally {
    OrderModel.exists = originals.exists;
    ProductModel.find = originals.productsFind;
    Movement.create = originals.movementCreate;
    OrderModel.create = originals.orderCreate;
    ProductModel.findOne = originals.productFind;
    ProductModel.findOneAndUpdate = originals.productUpdate;
    InvoiceModel.create = originals.invoiceCreate;
  }
}, { Order: [], Movement: [] }));


test("GET provides stable historical report rows and normalizations without any writes", () => isolated(async (db) => {
  const before = db.snapshot();
  const a = await invoke(warehouseRoutes, "/warehouse-movements", {}, "GET");
  const b = await invoke(warehouseRoutes, "/warehouse-movements", {}, "GET");
  assert.deepEqual(a, b);
  assert.equal(a.data.length, 2);
  const virtual = a.data.find((m) => m.virtual);
  assert.equal(virtual.items[0].quantity, 2);
  assert.equal(virtual.status, "Aceptado");
  assert.equal(virtual.orderId, "O1");
  assert.equal(a.data.find((m) => m.id === "I-old").items[0].quantity, 5);
  assert.deepEqual(db.snapshot(), before);
}, { Order: [{ ...order, status: "Enviado", warehouseGuideVersion: undefined, date: "2020-01-01", items: [{ ...item, quantity: "2" }] }], Movement: [{ id: "I-old", type: "Ingreso", items: [{ productId: "P1", quantityOrdered: "3", quantityExtras: "2", custom: true }] }] }));

test("accepted and automatic ingress update the same size before guided or unguided salida", () => isolated(async () => {
  const { default: OP } = await import("../backend/models/ProductionOrder.js");
  const { default: Ledger } = await import("../backend/models/Kardex.js");
  for (const autoAccept of [false, true]) for (const guideMode of ["CON_GUIA", "SIN_GUIA"]) {
    const db = memory({ Order: [], Movement: [], Product: [{ id: "P1", stockPhysical: 4, stockCommitted: 0, sizes: { M: { stockPhysical: 0, stockCommitted: 0 } } }] });
    const saved = [];
    const set = (model, key, value) => { saved.push([model, key, model[key]]); model[key] = value; };
    for (const [model, methods] of [[Movement, db.models.Movement], [ProductModel, db.models.Product], [OP, db.models.ProductionOrder]]) for (const key of ["find", "findOne", "findOneAndUpdate"]) set(model, key, methods[key]);
    set(Movement, "create", async (row) => (await db.models.Movement.create([row]))[0]);
    set(Ledger, "create", async (row) => (await db.models.Kardex.create([row]))[0]);
    const oldService = { ...salidaService };
    Object.assign(salidaService, db.service);
    try {
      const incoming = await invoke(warehouseRoutes, "/warehouse-movements/create-ingreso", { items: [{ ...item, quantity: "2" }], originType: "A Pedido", autoAccept });
      if (!autoAccept) await invoke(warehouseRoutes, "/warehouse-movements/accept", { movementId: incoming.data.movement.id });
      assert.equal(db.snapshot().Product[0].stockPhysical, 6);
      assert.equal(db.snapshot().Product[0].sizes.M.stockPhysical, 2);
      assert.equal(db.snapshot().Product[0].sizes.M.stockCommitted, 2);
      await invoke(warehouseRoutes, "/warehouse-movements/create-salida", { ...registration, orderId: undefined, items: [item], guideMode });
      assert.equal(db.snapshot().Product[0].stockPhysical, 4);
      assert.equal(db.snapshot().Product[0].sizes.M.stockPhysical, 0);
      assert.equal(db.snapshot().Product[0].sizes.M.stockCommitted, 0);
    } finally { for (const [model, key, value] of saved.reverse()) model[key] = value; Object.assign(salidaService, oldService); }
  }
}));
