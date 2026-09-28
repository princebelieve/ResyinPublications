import test from "node:test";
import assert from "node:assert/strict";
import handler from "./share-product.js";

test("preview contains book metadata before JavaScript and uses VITE_API_URL only", async () => {
  const originalFetch = globalThis.fetch;
  const originalBackend = process.env.VITE_API_URL;
  process.env.VITE_API_URL = "https://example.onrender.com/";
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, send(body) { this.body = body; return this; } };
  const id = "507f1f77bcf86cd799439011";
  try {
    globalThis.fetch = async (url) => {
      assert.equal(url, `https://example.onrender.com/api/products/${id}`);
      return { ok: true, json: async () => ({ name: 'Nigeria "Book"', shortDescription: '<script>bad</script> & history', coverImage: 'https://images.example.com/book.png' }) };
    };
    await handler({ query: { id } }, res);
    assert.equal(res.code, 200);
    assert.match(res.body, /og:image" content="https:\/\/images.example.com\/book.png/);
    assert.match(res.body, /og:title" content="Nigeria &quot;Book&quot;/);
    assert.match(res.body, /og:description" content="&lt;script&gt;bad/);
    assert.match(res.body, new RegExp(`window.location.replace\\("https://resyinpublications.com/product/${id}"\\)`));
    assert.doesNotMatch(res.body, /icon-512|<script>bad/);
    globalThis.fetch = async () => ({ ok: false, status: 404 });
    await handler({ query: { id } }, res);
    assert.equal(res.code, 404);
    globalThis.fetch = async () => { throw new Error("Unavailable"); };
    await handler({ query: { id } }, res);
    assert.equal(res.code, 503);
    await handler({ query: { id: "invalid" } }, res);
    assert.equal(res.code, 400);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBackend === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = originalBackend;
  }
});
