const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveCollection } = require("./collection");
const input = { deliveryMethod: "delivery", country: "NG", state: " edo ", pickupTransportCompany: "Partner", transportCompanyId: "507f1f77bcf86cd799439011" };
const noLookup = () => { throw new Error("Unexpected partner lookup"); };

test("digital purchases and office pickup need no partner", async () => {
  assert.equal((await resolveCollection(input, true, noLookup)).deliveryMethod, "digital");
  const pickup = await resolveCollection({ deliveryMethod: "pickup" }, false, noLookup);
  assert.equal(pickup.pickupLocation, "RESYIN Publications, Benin City");
  assert.equal(pickup.transportCompanyPickupPoint, "");
});
test("partner must be active and cover the normalized state; save authoritative name", async () => {
  const result = await resolveCollection(input, false, async (filter) => {
    assert.deepEqual(filter, { active: true, states: "EDO", _id: input.transportCompanyId });
    return { _id: input.transportCompanyId, name: "Current partner name" };
  });
  assert.equal(result.transportCompanyPickupPoint, "Current partner name");
  assert.equal(result.collectionState, "EDO");
  assert.equal(result.collectionStatus, "pending_confirmation");
  await assert.rejects(resolveCollection(input, false, async () => null), { statusCode: 400 });
});
test("older clients sending names still undergo coverage checks", async () => {
  await resolveCollection({ ...input, transportCompanyId: undefined }, false, async (filter) => {
    assert.deepEqual(filter, { active: true, states: "EDO", name: "Partner" });
    return { _id: input.transportCompanyId, name: "Partner" };
  });
});
test("Other needs explicit acknowledgement and remains unconfirmed", async () => {
  const other = { ...input, pickupTransportCompany: "Other / specify a delivery partner or park", pickupOtherLocation: "Requested park" };
  await assert.rejects(resolveCollection(other, false, noLookup), { statusCode: 400 });
  const result = await resolveCollection({ ...other, collectionRequestAcknowledged: true }, false, noLookup);
  assert.equal(result.transportCompanyId, null);
  assert.equal(result.collectionStatus, "pending_confirmation");
});
test("invalid fulfilment, state, partner ID and international partner selection are rejected", async () => {
  for (const invalid of [{ deliveryMethod: "invalid" }, { state: "" }, { transportCompanyId: "invalid" }, { country: "GB" }]) {
    await assert.rejects(resolveCollection({ ...input, ...invalid }, false, noLookup), { statusCode: 400 });
  }
});
