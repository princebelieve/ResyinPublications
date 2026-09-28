import assert from "node:assert/strict";
import test from "node:test";
import { getShareUrl } from "./metaTags.js";

test("book shares open the storefront details page and safely encode book data", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { location: { origin: "https://resyinpublications.com" } };
  try {
    const url = new URL(getShareUrl("book/id?", "Nigeria & Society #1"));
    assert.equal(url.origin, "https://resyinpublications.com");
    assert.equal(url.pathname, "/product/book%2Fid%3F");
    assert.equal(url.searchParams.get("utm_campaign"), "Nigeria & Society #1");
    assert.equal(url.searchParams.get("utm_source"), "share");
    assert.equal(url.searchParams.get("utm_medium"), "social");

    globalThis.window.location.origin = "http://localhost:5173";
    const localUrl = new URL(getShareUrl("123"));
    assert.equal(localUrl.origin, "http://localhost:5173");
    assert.equal(localUrl.pathname, "/product/123");
    assert.equal(localUrl.searchParams.get("utm_campaign"), "book");
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
