export function normalizeNotificationLink(link) {
  if (typeof link !== "string") {
    return "/notifications";
  }

  const trimmed = link.trim();

  if (!trimmed) {
    return "/notifications";
  }

  if (/^(https?:|mailto:)/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function openNotificationLink(link) {
  const normalized = normalizeNotificationLink(link);

  if (/^(https?:|mailto:)/i.test(normalized)) {
    window.open(normalized, "_blank", "noopener,noreferrer");
    return;
  }

  return normalized;
}
