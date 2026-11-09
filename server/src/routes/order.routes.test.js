const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function fixture({ order = { paymentMethod: "paystack", paymentStatus: "pending" }, verified } = {}) {
  const routes = {};
  const filters = [];
  let initialized = 0;
  const router = { get: (url, ...handlers) => { routes[url] = handlers.at(-1); }, post: (url, ...handlers) => { routes[url] = handlers.at(-1); } };
  const exported = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "order.routes.js"), "utf8"), {
    module: exported, process: { env: {} }, console,
    require(name) {
      if (name === "express") return { Router: () => router };
      if (name === "crypto") return crypto;
      if (name.includes("models/Order")) return { async findOne(filter) { filters.push(filter); return order; } };
      if (name.includes("services/orderPayment")) return { async verifyOrderPayment(value) { return verified || { order: value, canRetry: false }; } };
      if (name.includes("services/paystack")) return { async post() { initialized++; throw new Error("Unexpected checkout"); } };
      return { protect() {} };
    },
  });
  async function call(route, params) {
    const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await routes[route]({ params, user: { id: "buyer-1" } }, response);
    return response;
  }
  return { call, filters, initialized: () => initialized };
}

test("confirmation can be refreshed and polled without consuming its token", async () => {
  const f = fixture();
  for (let i = 0; i < 2; i++) {
    const response = await f.call("/confirmation/:token", { token: "secret" });
    assert.equal(response.code, 200);
    assert.equal(response.body.paymentStatus, "pending");
  }
  assert.equal(f.filters[0].confirmationTokenHash, crypto.createHash("sha256").update("secret").digest("hex"));
  assert.ok(f.filters[0].confirmationTokenExpires.$gt);
});

test("verification is scoped to the signed-in buyer", async () => {
  const f = fixture({ order: null });
  assert.equal((await f.call("/:id/verify-payment", { id: "someone-elses-order" })).code, 404);
  assert.equal(f.filters[0].userId, "buyer-1");
});

test("complete payment refuses a new checkout while transfer is pending", async () => {
  const f = fixture();
  assert.equal((await f.call("/:id/complete-payment", { id: "order-1" })).code, 409);
  assert.equal(f.initialized(), 0);
});

test("complete payment recovers a successful debit instead of initializing payment", async () => {
  const f = fixture({ verified: { order: { paymentStatus: "paid" }, canRetry: false } });
  const response = await f.call("/:id/complete-payment", { id: "order-1" });
  assert.equal(response.body.paid, true);
  assert.equal(f.initialized(), 0);
});
