const express = require("express");

const router = express.Router();

const {
  getAdminProduct,
  getAdminProducts,
  approveProduct,
  rejectProduct,
  setProductVisibility,
} = require("../controllers/product.controller");
const {
  protect,
  adminOnly,
  adminOrSubadminOnly,
} = require("../middleware/auth");

router.get("/", protect, adminOrSubadminOnly, getAdminProducts);
router.get("/:id", protect, adminOrSubadminOnly, getAdminProduct);
router.put("/:id/approve", protect, adminOnly, approveProduct);
router.put("/:id/reject", protect, adminOnly, rejectProduct);
router.put("/:id/visibility", protect, adminOnly, setProductVisibility);

module.exports = router;
