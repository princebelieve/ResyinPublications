const OTHER_PARTNER = "Other / specify a delivery partner or park";

async function resolveCollection(input, digitalOnly, findPartner) {
  const empty = { transportCompanyId: null, transportCompanyPickupPoint: "", collectionState: "", collectionStatus: "not_applicable", pickupLocation: "" };
  if (digitalOnly) return { ...empty, deliveryMethod: "digital" };
  if (input.deliveryMethod === "pickup") return { ...empty, deliveryMethod: "pickup", pickupLocation: "RESYIN Publications, Benin City" };
  const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };
  if (input.deliveryMethod !== "delivery") fail("Choose delivery or RESYIN office pickup.");
  const state = String(input.state || "").trim().toUpperCase();
  if (!state) fail("Select your delivery state or region.");
  const name = String(input.pickupTransportCompany || "").trim();
  const pending = { ...empty, deliveryMethod: "delivery", collectionState: state, collectionStatus: "pending_confirmation" };
  if (name === OTHER_PARTNER) {
    const requested = String(input.pickupOtherLocation || "").trim();
    if (!requested || requested.length > 200) fail("Enter a delivery partner or park (up to 200 characters).");
    if (input.collectionRequestAcknowledged !== true) fail("Confirm that your requested park needs RESYIN approval before dispatch.");
    return { ...pending, transportCompanyPickupPoint: requested };
  }
  if (String(input.country || "").toUpperCase() !== "NG") fail("For international delivery, specify your requested collection location using Other.");
  if (!name && !input.transportCompanyId) fail("Select a delivery partner or collection park.");
  if (input.transportCompanyId && !/^[a-f\d]{24}$/i.test(input.transportCompanyId)) fail("Select a valid delivery partner.");
  const partner = await findPartner({ active: true, states: state, ...(input.transportCompanyId ? { _id: input.transportCompanyId } : { name }) });
  if (!partner) fail("This partner is no longer available in your selected state. Please choose again.");
  return { ...pending, transportCompanyId: partner._id, transportCompanyPickupPoint: partner.name };
}

module.exports = { resolveCollection };
