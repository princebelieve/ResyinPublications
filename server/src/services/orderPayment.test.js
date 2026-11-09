const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

function fixture(statuses = {}) {
  let claims = 0;
  let saves = 0;
  let locked = false;
  const order = {
    _id: "order-1", userId: "buyer", paymentMethod: "paystack", paymentStatus: "pending",
    paymentReference: "latest", paymentReferences: ["older", "latest"],
    totalAmount: 100, currency: "NGN", items: [], statusHistory: [],
    async save() { saves++; },
  };
  const models = {
    async findOne() { return order; },
    async findById() { return order; },
    async findOneAndUpdate() {
      claims++;
      if (locked) return null;
      locked = true;
      return order;
    },
    async updateOne() { locked = false; },
  };
  const requests = [];
  const exports = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "orderPayment.js"), "utf8"), {
    module: exports, console,
    require(name) {
      if (name === "./paystack") return { async get(url) {
        const reference = decodeURIComponent(url.split("/").pop());
        requests.push(reference);
        if (statuses[reference] instanceof Error) throw statuses[reference];
        return { data: { status: true, data: { reference, status: statuses[reference] || "pending", amount: 10000, currency: "NGN" } } };
      } };
      if (name.includes("notification.service")) return { createNotification: async () => null };
      if (name.includes("push.service")) return {};
      return models;
    },
  });
  return { order, ...exports.exports, requests, counts: () => ({ claims, saves }) };
}

test("ongoing transfer prevents another checkout, including an older reference", async () => {
  const f = fixture({ latest: "abandoned", older: "ongoing" });
  assert.equal((await f.verifyOrderPayment(f.order)).canRetry, false);
  assert.deepEqual(f.requests, ["latest", "older"]);
});

test("only terminal unsuccessful attempts permit retry", async () => {
  const f = fixture({ latest: "failed", older: "abandoned" });
  assert.equal((await f.verifyOrderPayment(f.order)).canRetry, true);
});

test("verification failure never permits another payment", async () => {
  const f = fixture({ latest: new Error("offline") });
  await assert.rejects(f.verifyOrderPayment(f.order), /offline/);
  assert.equal(f.counts().saves, 0);
});

test("payment on an earlier reference recovers the order and fulfils once", async () => {
  const f = fixture({ latest: "abandoned", older: "success" });
  const result = await f.verifyOrderPayment(f.order);
  assert.equal(result.order.paymentStatus, "paid");
  await f.confirmOrderPayment({ reference: "older", status: "success", amount: 10000, currency: "NGN" });
  assert.equal(f.counts().saves, 1);
});

test("wrong amounts and currency never unlock downloads", async () => {
  for (const data of [{ amount: 1, currency: "NGN" }, { amount: 10000, currency: "USD" }]) {
    const f = fixture();
    await assert.rejects(f.confirmOrderPayment({ reference: "latest", status: "success", ...data }), /does not match/);
    assert.equal(f.order.paymentStatus, "pending");
    assert.equal(f.counts().claims, 0);
  }
});

test("refunded orders cannot be reopened by a delayed success event", async () => {
  const f = fixture();
  f.order.paymentStatus = "refunded";
  await f.confirmOrderPayment({ reference: "latest", status: "success", amount: 10000, currency: "NGN" });
  assert.equal(f.order.paymentStatus, "refunded");
  assert.equal(f.counts().saves, 0);
});
