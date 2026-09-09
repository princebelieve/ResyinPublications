const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function youtubeVideoId(parsed) {
  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return "";

  if (host.endsWith("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0] || "";

  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts[0] === "watch") return parsed.searchParams.get("v") || "";
  if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || "";
  return "";
}

export function getVideoEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const youtubeId = youtubeVideoId(parsed);
    if (youtubeId) return `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}`;

    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(parsed.hostname.toLowerCase())) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : "";
    }
  } catch {
    return "";
  }

  return "";
}
