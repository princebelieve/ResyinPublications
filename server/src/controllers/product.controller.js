// server/src/controllers/product.controller.js
const Product = require("../models/Product");
const User = require("../models/User");
const { uploadToR2, deleteFromR2 } = require("../config/r2");
const {
  createNotification,
  notifyAdmins,
} = require("../services/notification.service");
const { sendPushToAdmins, sendPushToUser } = require("../services/push.service");

async function assertUniqueProductName(name, excludedProductId) {
  const trimmedName = name?.trim();
  if (!trimmedName) return;

  const query = { name: trimmedName };
  if (excludedProductId) query._id = { $ne: excludedProductId };

  const existingProduct = await Product.findOne(query)
    .collation({ locale: "en", strength: 2 })
    .select("_id")
    .lean();

  if (existingProduct) {
    const error = new Error("A product with this name already exists.");
    error.statusCode = 409;
    throw error;
  }
}

function assertProductImages(files) {
  const productFiles = [
    ...(files.coverImage || []),
    ...(files.gallery || []),
  ];

  const invalidFile = productFiles.find(
    (file) => !file.mimetype || !file.mimetype.startsWith("image/"),
  );

  if (invalidFile) {
    const error = new Error("Product media must be image files.");
    error.statusCode = 400;
    throw error;
  }
}

async function deleteProductMedia(product) {
  const mediaUrls = [...new Set([product.coverImage, ...(product.gallery || [])].filter(Boolean))];
  if (!mediaUrls.length) return [];

  // Do not remove a file if another product is still using that exact URL.
  const productsUsingMedia = await Product.find({
    _id: { $ne: product._id },
    $or: [{ coverImage: { $in: mediaUrls } }, { gallery: { $in: mediaUrls } }],
  })
    .select("coverImage gallery")
    .lean();
  const sharedUrls = new Set(
    productsUsingMedia.flatMap((item) => [item.coverImage, ...(item.gallery || [])]),
  );

  const results = await Promise.allSettled(
    mediaUrls.filter((url) => !sharedUrls.has(url)).map(deleteFromR2),
  );

  return results.filter((result) => result.status === "rejected");
}

async function permanentlyDeleteProduct(product) {
  await Product.findByIdAndDelete(product._id);

  const failedMediaDeletes = await deleteProductMedia(product);
  if (failedMediaDeletes.length) {
    console.error(
      `Deleted product ${product._id}, but could not remove ${failedMediaDeletes.length} media file(s) from R2.`,
    );
  }

  return failedMediaDeletes.length;
}

async function getProducts(req, res) {
  try {
    const products = await Product.find({
      hidden: { $ne: true },
      pendingApproval: { $ne: true },
      pendingDeletion: { $ne: true },
      status: { $ne: "inactive" },
      approved: { $ne: false },
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("Error in getProducts:", err);

    res.status(err.statusCode || 500).json({
      error: err.message,
    });
  }
}

async function getProduct(req, res) {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      hidden: { $ne: true },
      pendingApproval: { $ne: true },
      pendingDeletion: { $ne: true },
      status: { $ne: "inactive" },
      approved: { $ne: false },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (err) {
    console.error("Error in getProduct:", err);

    res.status(500).json({
      error: err.message,
    });
  }
}

async function getProductCategories(req, res) {
  try {
    const products = await Product.find({}, "category").lean();
    const categories = [...new Set(products.map((p) => p.category?.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ label, value: label }));
    res.json(categories);
  } catch (err) {
    console.error("Error in getProductCategories:", err);
    res.status(500).json({
      error: err.message,
    });
  }
}

function generateSKU(name, category) {
  const prefix = (category || "GEN").slice(0, 3).toUpperCase();

  const namePart = (name || "ITEM")
    .replace(/\s+/g, "")
    .slice(0, 5)
    .toUpperCase();

  const timePart = Date.now().toString().slice(-5);

  const randomPart = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${namePart}-${timePart}-${randomPart}`;
}

async function createProduct(req, res) {
  try {
    const {
      name,
      slug,
      category,
      shortDescription,
      fullDescription,
      price,
      stock,
      featured,
      status,
      salePrice, distributorPrice, distributorMinimumQuantity, currency, brand, vendor, gtin, nafdacNumber, googleProductCategory,
      condition, ingredients, directions, warnings, netContent, countryOfOrigin,
      shippingWeight, shippingLength, shippingWidth, shippingHeight,
      shippingClass, shipsInternationally,
    } = req.body;

    const files = req.files || {};
    assertProductImages(files);
    await assertUniqueProductName(name);

    // COVER IMAGE
    let coverImage = "";

    if (files.coverImage?.[0]) {
      coverImage = await uploadToR2(files.coverImage[0]);
    }

    // GALLERY
    const gallery = [];

    if (files.gallery?.length) {
      for (const file of files.gallery) {
        const uploaded = await uploadToR2(file);

        gallery.push(uploaded);
      }
    }

    const generatedSku = generateSKU(name, category);

    const isSubadmin = req.user?.role === "subadmin";

    const adminUsers = await User.find({ role: "admin" }).select("_id");
    const adminIds = adminUsers.map((admin) => admin._id);

    const product = await Product.create({
      name,

      slug,

      category,

      shortDescription,

      fullDescription,

      coverImage,

      gallery,

      price: Number(price || 0),

      stock: Number(stock || 0),

      featured: featured === "true" || featured === true,

      status: isSubadmin ? "inactive" : status || "active",

      sku: generatedSku,

      inStock: Number(stock || 0) > 0,

      salePrice: salePrice === "" || salePrice === undefined ? null : Number(salePrice),
      distributorPrice: distributorPrice === "" || distributorPrice === undefined ? null : Number(distributorPrice),
      distributorMinimumQuantity: Math.max(1, Number(distributorMinimumQuantity || 1)),
      currency: "NGN",
      brand: brand || "",
      vendor: vendor || "",
      gtin: gtin || "",
      nafdacNumber: nafdacNumber || "",
      googleProductCategory: googleProductCategory || "",
      condition: condition || "new",
      ingredients: ingredients || "",
      directions: directions || "",
      warnings: warnings || "",
      netContent: netContent || "",
      countryOfOrigin: countryOfOrigin || "",
      shippingWeight: Number(shippingWeight || 0),
      shippingLength: Number(shippingLength || 0),
      shippingWidth: Number(shippingWidth || 0),
      shippingHeight: Number(shippingHeight || 0),
      shippingClass: shippingClass || "standard",
      shipsInternationally: shipsInternationally !== "false" && shipsInternationally !== false,

      approved: !isSubadmin,
      pendingApproval: isSubadmin,
      hidden: isSubadmin,
      submittedBy: isSubadmin ? req.user._id : undefined,
      approvalRequestedBy: isSubadmin ? req.user._id : undefined,
    });

    if (isSubadmin && adminIds.length > 0) {
      await notifyAdmins(
        {
          type: "product.upload",
          title: "Product upload submitted",
          body: `"${product.name}" has been submitted for review.`,
          link: `/admin/products/edit/${product._id}`,
          data: {
            productId: product._id,
            status: isSubadmin ? "pending" : "published",
          },
        },
        adminIds,
      );

      await sendPushToAdmins(adminIds, {
        title: "Product upload submitted",
        body: `"${product.name}" has been submitted for review.`,
        link: `/admin/products/edit/${product._id}`,
        data: { productId: product._id, type: "product.upload" },
      }).catch((pushErr) => console.warn("Push to admins failed:", pushErr));
    } else if (!isSubadmin) {
      // Administrators publish immediately, so their confirmation must not
      // imply that the visible product is still awaiting approval.
      await createNotification({
        userId: req.user._id,
        type: "product.published",
        title: "Product published",
        body: `"${product.name}" is now live in the product catalogue.`,
        link: `/admin/products/edit/${product._id}`,
        data: { productId: product._id, status: "published" },
      });

      await sendPushToUser(req.user._id, {
        title: "Product published",
        body: `"${product.name}" is now live in the product catalogue.`,
        link: `/admin/products/edit/${product._id}`,
        data: { productId: product._id, type: "product.published" },
      }).catch((pushErr) => console.warn("Push to admin failed:", pushErr));
    }

    res.status(201).json(product);
  } catch (err) {
    console.error("Error in createProduct:", err);

    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      const adminIds = admins.map((admin) => admin._id);

      if (adminIds.length > 0) {
        await notifyAdmins(
          {
            type: "product.upload.failed",
            title: "Product upload failed",
            body: `A product upload failed: ${err.message}`,
            link: "/admin/products",
            data: { error: err.message },
          },
          adminIds,
        );
      }
    } catch (notifyErr) {
      console.warn(
        "Failed to notify admins about product upload error:",
        notifyErr,
      );
    }

    res.status(500).json({
      error: err.message,
    });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      name,
      slug,
      category,
      shortDescription,
      fullDescription,
      price,
      stock,
      featured,
      status,
      sku,
      salePrice, distributorPrice, distributorMinimumQuantity, currency, brand, vendor, gtin, nafdacNumber, googleProductCategory,
      condition, ingredients, directions, warnings, netContent, countryOfOrigin,
      shippingWeight, shippingLength, shippingWidth, shippingHeight,
      shippingClass, shipsInternationally,
    } = req.body;

    const files = req.files || {};
    assertProductImages(files);
    await assertUniqueProductName(name, product._id);

    // BASIC FIELDS
    product.name = name || product.name;

    product.slug = slug || product.slug;

    product.category = category || product.category;

    product.shortDescription = shortDescription || product.shortDescription;

    product.fullDescription = fullDescription || product.fullDescription;

    product.price = Number(price || product.price);

    if (stock !== undefined) {
      product.stock = Number(stock || 0);

      product.inStock = Number(stock || 0) > 0;
    }

    if (featured !== undefined) {
      product.featured = featured === true || featured === "true";
    }

    if (status) {
      product.status = status;
    }

    if (salePrice !== undefined) product.salePrice = salePrice === "" ? null : Number(salePrice);
    if (distributorPrice !== undefined) product.distributorPrice = distributorPrice === "" ? null : Number(distributorPrice);
    if (distributorMinimumQuantity !== undefined) product.distributorMinimumQuantity = Math.max(1, Number(distributorMinimumQuantity || 1));
    product.currency = "NGN";
    if (brand !== undefined) product.brand = brand;
    if (vendor !== undefined) product.vendor = vendor;
    if (gtin !== undefined) product.gtin = gtin;
    if (nafdacNumber !== undefined) product.nafdacNumber = nafdacNumber;
    if (googleProductCategory !== undefined) product.googleProductCategory = googleProductCategory;
    if (condition) product.condition = condition;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (directions !== undefined) product.directions = directions;
    if (warnings !== undefined) product.warnings = warnings;
    if (netContent !== undefined) product.netContent = netContent;
    if (countryOfOrigin !== undefined) product.countryOfOrigin = countryOfOrigin;
    if (shippingWeight !== undefined) product.shippingWeight = Number(shippingWeight || 0);
    if (shippingLength !== undefined) product.shippingLength = Number(shippingLength || 0);
    if (shippingWidth !== undefined) product.shippingWidth = Number(shippingWidth || 0);
    if (shippingHeight !== undefined) product.shippingHeight = Number(shippingHeight || 0);
    if (shippingClass !== undefined) product.shippingClass = shippingClass;
    if (shipsInternationally !== undefined) product.shipsInternationally = shipsInternationally !== "false" && shipsInternationally !== false;

    // COVER IMAGE
    if (files.coverImage?.[0]) {
      product.coverImage = await uploadToR2(files.coverImage[0]);
    }

    // GALLERY
    if (files.gallery?.length) {
      const gallery = [];

      for (const file of files.gallery) {
        const uploaded = await uploadToR2(file);

        gallery.push(uploaded);
      }

      product.gallery = gallery;
    }

    await product.save();

    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((admin) => admin._id);

    if (adminIds.length > 0) {
      await notifyAdmins(
        {
          type: "product.updated",
          title: "Product updated",
          body: `"${product.name}" was updated successfully.`,
        link: `/admin/products/edit/${product._id}`,
          data: { productId: product._id },
        },
        adminIds,
      );
    }

    // Check for low stock alert
    const LOW_STOCK_THRESHOLD = 5;
    if (product.stock <= LOW_STOCK_THRESHOLD && product.stock > 0) {
      const admins = await User.find({ role: "admin" }).select("_id");
      const adminIds = admins.map((admin) => admin._id);

      if (adminIds.length > 0) {
        await notifyAdmins(
          {
            type: "stock.alert",
            title: "Low Stock Alert",
            body: `Product "${product.name}" has low stock: ${product.stock} unit(s) remaining.`,
            link: `/admin/products/edit/${product._id}`,
            data: { productId: product._id, stock: product.stock },
          },
          adminIds,
        );
      }
    }

    res.json(product);
  } catch (err) {
    console.error("Error in updateProduct:", err);

    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      const adminIds = admins.map((admin) => admin._id);

      if (adminIds.length > 0) {
        await notifyAdmins(
          {
            type: "product.update.failed",
            title: "Product update failed",
            body: `Product update failed: ${err.message}`,
            link: "/admin/products",
            data: { error: err.message },
          },
          adminIds,
        );
      }
    } catch (notifyErr) {
      console.warn(
        "Failed to notify admins about product update error:",
        notifyErr,
      );
    }

    res.status(err.statusCode || 500).json({
      error: err.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (req.user.role === "subadmin") {
      product.pendingDeletion = true;
      product.hidden = true;
      product.deletionRequestedBy = req.user._id;
      product.deletionRequestedAt = Date.now();
      await product.save();

      return res.json({
        message:
          "Delete request submitted. Product is hidden until an admin approves or rejects it.",
      });
    }

    const failedMediaDeletes = await permanentlyDeleteProduct(product);

    res.json({
      message: failedMediaDeletes
        ? "Product deleted, but some unused media files could not be removed."
        : "Product and its unused media files were deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteProduct:", err);

    res.status(500).json({
      error: err.message,
    });
  }
}

async function setProductVisibility(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.pendingDeletion) {
      return res.status(400).json({ message: "Resolve the pending deletion request before changing visibility." });
    }

    product.hidden = req.body.hidden === true || req.body.hidden === "true";
    await product.save();

    res.json({
      message: product.hidden ? "Product hidden from customers." : "Product is visible to customers again.",
      product,
    });
  } catch (err) {
    console.error("Error changing product visibility:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getAdminProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error in getAdminProduct:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getAdminProducts(req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("Error in getAdminProducts:", err);

    res.status(500).json({
      error: err.message,
    });
  }
}

async function approveProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.pendingApproval) {
      product.pendingApproval = false;
      product.approved = true;
      product.hidden = false;
      product.status = "active";
      await product.save();

      return res.json({ message: "Product approved", product });
    }

    if (product.pendingDeletion) {
      const failedMediaDeletes = await permanentlyDeleteProduct(product);
      return res.json({
        message: failedMediaDeletes
          ? "Product deletion approved, but some unused media files could not be removed."
          : "Product deletion approved and product media removed.",
      });
    }

    return res
      .status(400)
      .json({ message: "No pending approval or deletion request found" });
  } catch (err) {
    console.error("Error in approveProduct:", err);
    res.status(500).json({ error: err.message });
  }
}

async function rejectProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.pendingApproval) {
      product.pendingApproval = false;
      product.hidden = true;
      product.status = "inactive";
      await product.save();

      return res.json({ message: "Product approval rejected" });
    }

    if (product.pendingDeletion) {
      product.pendingDeletion = false;
      product.hidden = false;
      product.deletionRequestedBy = undefined;
      product.deletionRequestedAt = undefined;
      await product.save();

      return res.json({ message: "Product deletion request rejected" });
    }

    return res
      .status(400)
      .json({ message: "No pending approval or deletion request found" });
  } catch (err) {
    console.error("Error in rejectProduct:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getProducts,
  getProduct,
  getProductCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductVisibility,
  getAdminProduct,
  getAdminProducts,
  approveProduct,
  rejectProduct,
};
