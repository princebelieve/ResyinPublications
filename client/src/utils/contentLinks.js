export function getSafeContentLink(linkUrl, fallback = "/testimonials") {
  const target = String(linkUrl || "").trim();
  if (!target) return fallback;

  try {
    const parsed = new URL(target, window.location.origin);
    if (/^\/health\/?$/i.test(parsed.pathname)) return fallback;
    return target;
  } catch {
    return fallback;
  }
}
