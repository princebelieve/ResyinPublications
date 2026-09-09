const categoryMap = require("../config/productCategoryMap");

function slugifyCategory(category) {
  return (category || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDeliveryCategory(category) {
  if (!category || typeof category !== "string") {
    return "custom-project";
  }

  if (categoryMap[category]) {
    return categoryMap[category];
  }

  const normalized = slugifyCategory(category);

  return normalized || "custom-project";
}

module.exports = {
  slugifyCategory,
  normalizeDeliveryCategory,
};
