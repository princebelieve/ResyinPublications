//server/src/seed/products.seed.js
const mongoose = require("mongoose");
const path = require("path");
const Product = require("../models/Product");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const products = [
  {
    name: "Classic Senator Wear",
    price: 1,
    image:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Luxury Suit",
    price: 2,
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Female Designer Gown",
    price: 1,
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log("Products seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
