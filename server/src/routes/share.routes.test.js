const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const shareRoutes = require("./share.routes");

test("old Render book links redirect to the storefront without database access", async () => {
  const app = express();
  app.use("/api/share", shareRoutes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const previousClientUrl = process.env.CLIENT_URL;
  try {
    for (const clientUrl of ["https://example.onrender.com/health", "https://example.onrender.com", ""]) {
      process.env.CLIENT_URL = clientUrl;
      const response = await fetch(
        `http://127.0.0.1:${server.address().port}/api/share/product/507f1f77bcf86cd799439011?utm_source=share&utm_campaign=Nigeria%20%26%20Society&redirect=https://example.com`,
        { redirect: "manual" },
      );
      assert.equal(response.status, 301);
      const destination = new URL(response.headers.get("location"));
      assert.equal(destination.origin, "https://resyinpublications.com");
      assert.equal(destination.pathname, "/share/product");
      assert.equal(destination.searchParams.get("utm_source"), "share");
      assert.equal(destination.searchParams.get("utm_campaign"), "Nigeria & Society");
      assert.equal(destination.searchParams.has("redirect"), false);
    }
  } finally {
    if (previousClientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = previousClientUrl;
    await new Promise((resolve) => server.close(resolve));
  }
});
