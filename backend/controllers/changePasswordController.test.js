import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { createChangePasswordHandler } from "./changePasswordController.js";

const originalHash = await bcrypt.hash("Anterior123", 4);
function setup({ body = {}, user = { id: "admin-session", role: "admin", password: originalHash }, modifiedCount = 1, updateError } = {}) {
  const writes = [];
  const handler = createChangePasswordHandler({
    comparePassword: (value, hash) => bcrypt.compare(value, hash),
    hashPassword: value => bcrypt.hash(value, 4),
    UserModel: { async updateOne(filter, update) {
      if (updateError) throw updateError;
      writes.push({ filter, update });
      return { modifiedCount };
    } }
  });
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
  const request = { currentUser: user, body: { currentPassword: "Anterior123", newPassword: "NuevaSegura456", confirmPassword: "NuevaSegura456", ...body } };
  return { writes, response, run: () => handler(request, response, error => { response.error = error; }) };
}

test("changes only the session account and writes a verifiable hash, never plaintext", async () => {
  const ctx = setup({ body: { id: "another-user", userId: "another-user", password: "ignored" } });
  await ctx.run();
  assert.equal(ctx.response.body.success, true);
  assert.equal(ctx.writes.length, 1);
  assert.deepEqual(ctx.writes[0].filter, { id: "admin-session", password: originalHash });
  const stored = ctx.writes[0].update.$set.password;
  assert.notEqual(stored, "NuevaSegura456");
  assert.equal(await bcrypt.compare("NuevaSegura456", stored), true);
  assert.equal(await bcrypt.compare("Anterior123", stored), false);
  assert.deepEqual(Object.keys(ctx.response.body).sort(), ["message", "success"]);
});

for (const [name, body, field] of [
  ["wrong current password", { currentPassword: "Incorrecta" }, "currentPassword"],
  ["missing current password", { currentPassword: "" }, "currentPassword"],
  ["short new password", { newPassword: "corta", confirmPassword: "corta" }, "newPassword"],
  ["mismatched confirmation", { confirmPassword: "Diferente456" }, "confirmPassword"],
  ["unchanged password", { newPassword: "Anterior123", confirmPassword: "Anterior123" }, "newPassword"],
  ["bcrypt byte limit", { newPassword: "á".repeat(37), confirmPassword: "á".repeat(37) }, "newPassword"],
  ["non-string password", { newPassword: { $ne: null } }, "newPassword"]
]) {
  test(`rejects ${name} without writing`, async () => {
    const ctx = setup({ body });
    await ctx.run();
    assert.equal(ctx.response.statusCode, 400);
    assert.equal(ctx.response.body.field, field);
    assert.equal(ctx.writes.length, 0);
  });
}

test("rejects non-admin sessions and accounts without a local password", async () => {
  for (const user of [null, { id: "customer", role: "customer", password: originalHash }, { id: "google-admin", role: "admin" }]) {
    const ctx = setup({ user });
    await ctx.run();
    assert.equal(ctx.response.body.success, false);
    assert.equal(ctx.writes.length, 0);
  }
});

test("rejects concurrent password replacement", async () => {
  const ctx = setup({ modifiedCount: 0 });
  await ctx.run();
  assert.equal(ctx.response.statusCode, 409);
  assert.equal(ctx.response.body.success, false);
});

test("forwards storage failures instead of reporting success", async () => {
  const error = new Error("Storage unavailable");
  const ctx = setup({ updateError: error });
  await ctx.run();
  assert.equal(ctx.response.error, error);
  assert.equal(ctx.response.body, undefined);
});
