import test from "node:test";
import assert from "node:assert/strict";
import { createInPersonSaleService, validateInPersonSale } from "./inPersonSaleService.js";
import OrderModel from "../models/Order.js";
import InvoiceModel from "../models/Invoice.js";
import MovementModel from "../models/WarehouseMovement.js";
import KardexModel from "../models/Kardex.js";

const date = new Date("2026-11-26T17:00:00Z");
const requestId = "12345678-1234-4321-8123-123456789abc";
const actor = { id: "admin-1", role: "admin", name: "Administrador" };
const payload = (changes = {}) => ({ requestId, date: "2026-11-26", docType: "Boleta", customerName: "Cliente presencial", customerDocument: "12345678", paymentMethod: "Efectivo", items: [{ productId: "P1", selectedSize: "M", quantity: 2 }], ...changes });
function setup({ failCollection, beforeTransaction } = {}) {
  let state = {
    products: [
      { id: "P1", name: "Oxford", price: 120, stockPhysical: 20, stockCommitted: 4, sizes: { S: 4, M: { stockPhysical: 10, stockCommitted: 2 }, L: { stockPhysical: 6, stockCommitted: 2 } } },
      { id: "P2", name: "Lino", price: 95.35, stockPhysical: 10, stockCommitted: 0, sizes: { S: 5, M: 5 } }
    ], orders: [], invoices: [], movements: [], kardex: [], users: [{ id: "customer-1", role: "customer" }]
  };
  const matches = (row, filter) => Object.entries(filter).every(([key, value]) => value?.$in ? value.$in.includes(row[key]) : row[key] === value);
  const model = collection => ({
    find(filter) { return { session() { return this; }, async lean() { return structuredClone(state[collection].filter(row => matches(row, filter))); } }; },
    findOne(filter) { return { session() { return this; }, async lean() { return structuredClone(state[collection].find(row => matches(row, filter)) || null); } }; },
    async create(documents, options) {
      assert.ok(options.session, "writes must use the transaction");
      if (failCollection === collection) throw new Error(`Failure in ${collection}`);
      for (const document of documents) {
        if (collection === "orders" && state.orders.some(order => order.id === document.id)) throw Object.assign(new Error("Duplicate"), { code: 11000 });
        state[collection].push(structuredClone(document));
      }
    },
    async updateOne(filter, update, options) {
      assert.ok(options.session);
      if (failCollection === collection) throw new Error(`Failure in ${collection}`);
      const row = state[collection].find(row => matches(row, filter));
      Object.assign(row, structuredClone(update.$set));
      return { matchedCount: 1, modifiedCount: 1 };
    }
  });
  const service = createInPersonSaleService({
    Order: model("orders"), Product: model("products"), Invoice: model("invoices"), Movement: model("movements"), Kardex: model("kardex"), User: model("users"), now: () => date,
    transaction: async callback => {
      beforeTransaction?.(state);
      const snapshot = structuredClone(state);
      try { return await callback({ id: "test-session" }); } catch (error) { state = snapshot; throw error; }
    }
  });
  return { service, state: () => structuredClone(state) };
}

test("registers a paid direct sale, accepted salida, invoice and Kardex in one transaction without a guide", async () => {
  const ctx = setup();
  const result = await ctx.service({ input: payload({ total: 1, type: "pedido", status: "Pendiente", guideNumber: "GR-99999", recordedBy: "someone-else" }), actor });
  assert.equal(result.order.total, 240);
  assert.equal(result.order.type, "direct");
  assert.equal(result.order.channel, "presencial");
  assert.equal(result.order.status, "Pagado Total");
  assert.equal(result.order.deliveryStatus, "Entregado en tienda");
  assert.equal(result.order.userId, undefined);
  assert.equal(result.order.recordedBy, actor.id);
  assert.equal(result.movement.status, "Aceptado");
  assert.equal(result.movement.guideNumber, undefined);
  assert.equal(result.movement.requiresGuide, false);
  assert.equal(result.invoice.total, 240);
  assert.equal(Number((result.invoice.subtotal + result.invoice.igv).toFixed(2)), 240);
  const state = ctx.state();
  assert.equal(state.products[0].stockPhysical, 18);
  assert.equal(state.products[0].stockCommitted, 4);
  assert.deepEqual(state.products[0].sizes.M, { stockPhysical: 8, stockCommitted: 2 });
  assert.equal(state.kardex.length, 1);
  assert.equal(state.kardex[0].quantity, 2);
  assert.equal(state.kardex[0].balance, 18);
  assert.equal(state.kardex[0].documentRef, result.order.id);
});

test("aggregates duplicate size lines, all product quantities and monetary totals", async () => {
  const ctx = setup();
  const result = await ctx.service({ actor, input: payload({ items: [{ productId: "P1", selectedSize: "M", quantity: 2 }, { productId: "P1", selectedSize: "M", quantity: 1 }, { productId: "P1", selectedSize: "S", quantity: 2 }, { productId: "P2", selectedSize: "S", quantity: 3 }] }) });
  assert.equal(result.order.items.length, 3);
  assert.equal(result.order.total, 886.05);
  const state = ctx.state();
  assert.equal(state.products[0].stockPhysical, 15);
  assert.equal(state.products[0].sizes.S.stockPhysical, 2);
  assert.equal(state.products[0].sizes.M.stockPhysical, 7);
  assert.equal(state.kardex.length, 2);
  assert.deepEqual(state.kardex.map(entry => entry.quantity), [5, 3]);
});

test("the existing Mongoose schemas retain the new metadata and size details without schema changes", async () => {
  const ctx = setup();
  const result = await ctx.service({ actor, input: payload() });
  for (const [Model, data] of [[OrderModel, result.order], [InvoiceModel, result.invoice], [MovementModel, result.movement], [KardexModel, ctx.state().kardex[0]]]) {
    const document = new Model(data);
    await document.validate();
    const stored = document.toObject();
    assert.equal(stored.items[0].selectedSize, "M");
    if (data.channel) assert.equal(stored.channel, "presencial");
    if (data.requiresGuide === false) assert.equal(stored.requiresGuide, false);
  }
});

test("retries are idempotent, and a reused key with different contents is rejected", async () => {
  const ctx = setup();
  const first = await ctx.service({ actor, input: payload() });
  const second = await ctx.service({ actor, input: payload() });
  assert.equal(second.replayed, true);
  assert.equal(second.order.id, first.order.id);
  assert.equal(ctx.state().products[0].stockPhysical, 18);
  for (const collection of ["orders", "invoices", "movements", "kardex"]) assert.equal(ctx.state()[collection].length, 1);
  await assert.rejects(ctx.service({ actor, input: payload({ paymentMethod: "Tarjeta" }) }), { status: 409 });
});

for (const failCollection of ["products", "movements", "kardex", "invoices"]) {
  test(`rolls back the entire sale when ${failCollection} fails`, async () => {
    const ctx = setup({ failCollection });
    const before = ctx.state();
    await assert.rejects(ctx.service({ actor, input: payload() }), /Failure/);
    assert.deepEqual(ctx.state(), before);
  });
}

test("rejects missing or non-admin actors without touching stock", async () => {
  for (const unauthorized of [undefined, { role: "customer" }, { role: "worker" }]) {
    const ctx = setup();
    await assert.rejects(ctx.service({ actor: unauthorized, input: payload() }), { status: 403 });
    assert.equal(ctx.state().orders.length, 0);
    assert.equal(ctx.state().products[0].stockPhysical, 20);
  }
});

test("validates aggregate availability and size stock instead of selling other reservations", async () => {
  for (const items of [
    [{ productId: "P1", selectedSize: "M", quantity: 9 }],
    [{ productId: "P1", selectedSize: "XL", quantity: 1 }],
    [{ productId: "missing", selectedSize: "S", quantity: 1 }]
  ]) {
    const ctx = setup();
    await assert.rejects(ctx.service({ actor, input: payload({ items }) }), { status: 409 });
    assert.equal(ctx.state().movements.length, 0);
  }
  const ctx = setup({ beforeTransaction: state => { state.products[0].stockCommitted = 19; } });
  await assert.rejects(ctx.service({ actor, input: payload() }), { status: 409 });
  assert.equal(ctx.state().products[0].stockPhysical, 20);
});

test("rejects an all-product aggregate over stock even when each size individually fits", async () => {
  const ctx = setup({ beforeTransaction: state => { state.products[0].stockCommitted = 16; } });
  await assert.rejects(ctx.service({ actor, input: payload({ items: [{ productId: "P1", selectedSize: "M", quantity: 3 }, { productId: "P1", selectedSize: "S", quantity: 3 }] }) }), { status: 409 });
  assert.equal(ctx.state().orders.length, 0);
});

test("guest billing does not create a web account; a selected account must be a customer", async () => {
  const ctx = setup();
  const result = await ctx.service({ actor, input: payload({ customerId: "customer-1", docType: "Factura", customerDocument: "20123456789", customerAddress: "Dirección fiscal" }) });
  assert.equal(result.order.userId, "customer-1");
  assert.equal(result.invoice.series, "F001");
  assert.equal(ctx.state().users.length, 1);
  const invalid = setup();
  await assert.rejects(invalid.service({ actor, input: payload({ customerId: "admin-1" }) }), { status: 400 });
});

for (const [name, changes] of [
  ["future date", { date: "2026-11-27" }], ["invalid date", { date: "2026-02-30" }],
  ["missing name", { customerName: "" }], ["invalid DNI", { customerDocument: "1" }],
  ["RUC without address", { docType: "Factura", customerDocument: "20123456789" }],
  ["invalid email", { customerEmail: "bad-email" }], ["invalid phone", { customerPhone: "abcdef" }],
  ["unsupported payment", { paymentMethod: "Crédito" }], ["empty items", { items: [] }],
  ["fractional quantity", { items: [{ productId: "P1", selectedSize: "M", quantity: 1.5 }] }],
  ["negative quantity", { items: [{ productId: "P1", selectedSize: "M", quantity: -1 }] }],
  ["invalid size", { items: [{ productId: "P1", selectedSize: "$where", quantity: 1 }] }]
]) {
  test(`rejects ${name} before any writes`, () => assert.throws(() => validateInPersonSale(payload(changes), date), { status: 400 }));
}
