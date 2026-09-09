import { Share2 } from "lucide-react";
import { getContentShareUrl } from "../utils/metaTags";

export default function PostShareButton({ title, text, url }) {
  async function sharePost() {
    const legacyMatch = url.match(/\/testimonials#([^/?#]+)/);
    const shareUrl = legacyMatch
      ? getContentShareUrl(legacyMatch[1])
      : url;
    const shareData = { title, text, url: shareUrl };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      window.alert("Post link copied.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        window.alert("Unable to share this post right now.");
      }
    }
  }

  return (
    <button type="button" className="post-share-button" onClick={sharePost}>
      <Share2 size={15} /> Share
    </button>
  );
}
