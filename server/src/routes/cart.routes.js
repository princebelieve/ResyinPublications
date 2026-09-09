//server/src/routes/cart.routes.js
const express = require("express");

const router = express.Router();

const Cart = require("../models/Cart");

const { protect } = require("../middleware/auth");

router.get("/", protect, async (req, res) => {
  let cart = await Cart.findOne({
    userId: req.user.id,
  }).populate("items.productId");

  if (!cart) {
    cart = await Cart.create({
      userId: req.user.id,
      items: [],
    });
  }

  res.json(cart);
});

router.post("/add", protect, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const quantityToAdd = Number(quantity);

  if (!Number.isSafeInteger(quantityToAdd) || quantityToAdd < 1) {
    return res.status(400).json({
      message: "Quantity must be a whole number of at least 1.",
    });
  }

  let cart = await Cart.findOne({
    userId: req.user.id,
  });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user.id,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId,
  );

  if (existingItem) {
    existingItem.quantity += quantityToAdd;
  } else {
    cart.items.push({
      productId,
      quantity: quantityToAdd,
    });
  }

  await cart.save();

  res.json(cart);
});

router.delete("/remove/:productId", protect, async (req, res) => {
  const cart = await Cart.findOne({
    userId: req.user.id,
  });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== req.params.productId,
  );

  await cart.save();

  res.json(cart);
});

router.put("/update/:productId", protect, async (req, res) => {
  const { quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({
      message: "Quantity must be at least 1",
    });
  }

  let cart = await Cart.findOne({
    userId: req.user.id,
  });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  const item = cart.items.find(
    (i) => i.productId.toString() === req.params.productId,
  );

  if (!item) {
    return res.status(404).json({
      message: "Item not found in cart",
    });
  }

  item.quantity = quantity;

  await cart.save();

  const updatedCart = await Cart.findOne({
    userId: req.user.id,
  }).populate("items.productId");

  res.json(updatedCart);
});

router.delete("/clear", protect, async (req, res) => {
  const cart = await Cart.findOne({
    userId: req.user.id,
  });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  cart.items = [];

  await cart.save();

  res.json({
    message: "Cart cleared",
  });
});

module.exports = router;
