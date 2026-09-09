//client/src/utils/formatDate.js
export function formatDate(date, options = {}) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  const {
    locale = "en-NG",
    dateStyle = "medium",
    timeStyle = "short",
  } = options;

  return parsed.toLocaleString(locale, {
    dateStyle,
    timeStyle,
  });
}
