const Testimonial = require("../models/Testimonial");
const User = require("../models/User");
const axios = require("axios");
const { uploadToR2, uploadBufferToR2, createPresignedContentUpload } = require("../config/r2");
const { createNotification, createNotificationsForUsers, notifyAdmins } = require("../services/notification.service");
const { sendPushToUsers } = require("../services/push.service");
const { sendAnnouncementEmail } = require("../services/email");

function asBoolean(value) {
  return value === true || value === "true";
}

function lastValue(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function publicFilter() {
  return { approved: { $ne: false }, status: "active" };
}

function youtubeThumbnailUrl(videoUrl = "") {
  try {
    const parsed = new URL(videoUrl);
    const host = parsed.hostname.toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);
    const videoId = host.endsWith("youtu.be")
      ? parts[0]
      : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)
        ? parsed.searchParams.get("v") || (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : "")
        : "";
    return videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : "";
  } catch {
    return "";
  }
}

async function storeYoutubeThumbnail(videoUrl) {
  const sourceUrl = youtubeThumbnailUrl(videoUrl);
  if (!sourceUrl) return "";
  try {
    const response = await axios.get(sourceUrl, { responseType: "arraybuffer", timeout: 15000, maxContentLength: 8 * 1024 * 1024 });
    const contentType = response.headers["content-type"] || "image/jpeg";
    return uploadBufferToR2(Buffer.from(response.data), { fileName: "youtube-video-thumbnail.jpg", contentType, folder: "testimonials/images" });
  } catch (error) {
    console.warn("Unable to store YouTube video thumbnail:", error.message);
    return "";
  }
}

function contentDestination(post) {
  const fallback = `/testimonials#${post._id}`;
  const candidate = String(post.linkUrl || (post.mediaType === "video" ? post.videoUrl : "")).trim();
  if (!candidate) return fallback;
  if (candidate.startsWith("/")) return /^\/health\/?$/i.test(candidate) ? fallback : candidate;
  try {
    const parsed = new URL(candidate);
    return /^\/health\/?$/i.test(parsed.pathname) ? fallback : parsed.toString();
  } catch {
    return fallback;
  }
}

async function keepBannerLimit(currentId) {
  const banners = await Testimonial.find({ bannerEnabled: true, approved: { $ne: false }, status: "active" })
    .sort({ createdAt: 1 });
  const excess = banners.filter((item) => String(item._id) !== String(currentId)).slice(0, Math.max(0, banners.length - 3));
  if (excess.length) await Testimonial.updateMany({ _id: { $in: excess.map((item) => item._id) } }, { $set: { bannerEnabled: false } });
}

async function getTestimonials(req, res) {
  try {
    const filter = { ...publicFilter() };
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.banner === "true") filter.bannerEnabled = true;
    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

  async function getTestimonialById(req, res) {
    try {
      const testimonial = await Testimonial.findOne({ _id: req.params.id, ...publicFilter() });
      if (!testimonial) return res.status(404).json({ message: "Content not found." });
      res.json(testimonial);
    } catch (error) {
      res.status(404).json({ message: "Content not found." });
    }
  }

async function getAdminTestimonials(req, res) {
  try {
    const filter = req.user.role === "subadmin" ? { submittedBy: req.user._id } : {};
    res.json(await Testimonial.find(filter).sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function createContentUploadUrl(req, res) {
  try {
    res.json(await createPresignedContentUpload(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to prepare the media upload." });
  }
}

async function createTestimonial(req, res) {
  try {
    const { contentType, mediaType, title, name, role, testimony, linkUrl, videoUrl, featured, bannerEnabled, sitewideAdvertEnabled, seoTitle, seoDescription, status } = req.body;
    if (!name || !testimony) return res.status(400).json({ message: "Author or organisation and content are required." });
    const isAdmin = req.user.role === "admin";

    let image = lastValue(req.body.image) || "";
    let videoFile = lastValue(req.body.videoFile || req.body.video) || "";
    let audioFile = lastValue(req.body.audioFile || req.body.audio) || "";
    if (req.files?.image?.[0]) image = await uploadToR2(req.files.image[0], "testimonials/images");
    if (req.files?.video?.[0]) videoFile = await uploadToR2(req.files.video[0], "testimonials/videos");
    if (req.files?.audio?.[0]) audioFile = await uploadToR2(req.files.audio[0], "testimonials/audio");
    if (!image && !videoFile && videoUrl) image = await storeYoutubeThumbnail(videoUrl);

    const testimonial = await Testimonial.create({
      contentType, mediaType: mediaType || (videoFile ? "video" : audioFile ? "audio" : image ? "image" : "text"), title, name, role, testimony, linkUrl, videoUrl, image, videoFile, audioFile,
      featured: asBoolean(featured),
      bannerEnabled: isAdmin && asBoolean(bannerEnabled),
      sitewideAdvertEnabled: isAdmin && asBoolean(sitewideAdvertEnabled),
      approved: isAdmin,
      status: isAdmin ? (status || "active") : "inactive",
      submittedBy: req.user._id,
      seoTitle, seoDescription,
    });
    if (testimonial.bannerEnabled) await keepBannerLimit(testimonial._id);
    if (!isAdmin) {
      const admins = await User.find({ role: "admin" }).select("_id");
      await notifyAdmins({
        type: "content.upload",
        title: "Content submitted for review",
        body: `"${testimonial.title || testimonial.contentType}" has been submitted for review.`,
        link: "/admin/testimonials",
        data: { contentId: testimonial._id, status: "pending" },
      }, admins.map((admin) => admin._id));
    } else {
      await createNotification({
        userId: req.user._id,
        type: "content.published",
        title: "Content published",
        body: `"${testimonial.title || testimonial.contentType}" is now saved.`,
        link: "/admin/testimonials",
        data: { contentId: testimonial._id, status: "published" },
      });
    }
    if (isAdmin && testimonial.approved && testimonial.status === "active") {
      await notifyUsersOfContent(testimonial);
      testimonial.announcementNotifiedAt = new Date();
      await testimonial.save();
    }
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function notifyUsersOfContent(post) {
  const users = await User.find({ isDeleted: { $ne: true }, isSuspended: { $ne: true } }).select("_id email").lean();
  const userIds = users.map((user) => user._id);
  const link = contentDestination(post);
  const payload = {
    type: `content.${post.contentType || "published"}`,
    title: post.title || "New RESYIN update",
    body: post.testimony.slice(0, 180),
    link,
    data: { contentId: post._id, contentType: post.contentType },
  };
  await createNotificationsForUsers(userIds, payload);
  await sendPushToUsers(userIds, { title: payload.title, body: payload.body, link, data: payload.data });
  await Promise.all(users.filter((user) => user.email).map((user) => sendAnnouncementEmail({ to: user.email, title: payload.title, body: post.testimony, link }).catch((error) => console.error("Announcement email failed:", error.message))));
}

async function updateTestimonial(req, res) {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Testimonial not found." });
    if (req.user.role === "subadmin" && String(testimonial.submittedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own submissions." });
    }

    const fields = ["contentType", "mediaType", "title", "name", "role", "testimony", "linkUrl", "videoUrl", "seoTitle", "seoDescription"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) testimonial[field] = req.body[field];
    });
    if (req.user.role === "admin") {
      if (req.body.featured !== undefined) testimonial.featured = asBoolean(req.body.featured);
      if (req.body.bannerEnabled !== undefined) testimonial.bannerEnabled = asBoolean(req.body.bannerEnabled);
      if (req.body.sitewideAdvertEnabled !== undefined) testimonial.sitewideAdvertEnabled = asBoolean(req.body.sitewideAdvertEnabled);
      if (req.body.approved !== undefined) testimonial.approved = asBoolean(req.body.approved);
      if (req.body.status !== undefined) testimonial.status = req.body.status;
    } else {
      testimonial.featured = false;
      testimonial.bannerEnabled = false;
      testimonial.sitewideAdvertEnabled = false;
      testimonial.approved = false;
      testimonial.status = "inactive";
    }
    if (req.body.image !== undefined) testimonial.image = lastValue(req.body.image);
    if (req.body.videoFile !== undefined) testimonial.videoFile = lastValue(req.body.videoFile);
    if (req.body.audioFile !== undefined) testimonial.audioFile = lastValue(req.body.audioFile);
    if (req.body.mediaType !== undefined) {
      testimonial.mediaType = req.body.mediaType;
      if (req.body.mediaType !== "image") testimonial.image = "";
      if (req.body.mediaType !== "video") testimonial.videoFile = "";
      if (req.body.mediaType !== "audio") testimonial.audioFile = "";
    }
    if (req.files?.image?.[0]) testimonial.image = await uploadToR2(req.files.image[0], "testimonials/images");
    if (req.files?.video?.[0]) testimonial.videoFile = await uploadToR2(req.files.video[0], "testimonials/videos");
    if (req.files?.audio?.[0]) testimonial.audioFile = await uploadToR2(req.files.audio[0], "testimonials/audio");
    if (!testimonial.image && !testimonial.videoFile && testimonial.videoUrl) testimonial.image = await storeYoutubeThumbnail(testimonial.videoUrl);

    const shouldNotify = req.user.role === "admin" && testimonial.approved && testimonial.status === "active" && !testimonial.announcementNotifiedAt;
    await testimonial.save();
    if (testimonial.bannerEnabled) await keepBannerLimit(testimonial._id);
    if (req.user.role === "subadmin") {
      const admins = await User.find({ role: "admin" }).select("_id");
      await notifyAdmins({
        type: "content.update",
        title: "Content update submitted for review",
        body: `"${testimonial.title || testimonial.contentType}" was updated and is awaiting review.`,
        link: "/admin/testimonials",
        data: { contentId: testimonial._id, status: "pending" },
      }, admins.map((admin) => admin._id));
    } else {
      await createNotification({
        userId: req.user._id,
        type: "content.updated",
        title: "Content updated",
        body: `"${testimonial.title || testimonial.contentType}" was updated successfully.`,
        link: "/admin/testimonials",
        data: { contentId: testimonial._id, status: "published" },
      });
    }
    if (shouldNotify) {
      await notifyUsersOfContent(testimonial);
      testimonial.announcementNotifiedAt = new Date();
      await testimonial.save();
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function deleteTestimonial(req, res) {
  try {
    const filter = req.user.role === "subadmin"
      ? { _id: req.params.id, submittedBy: req.user._id }
      : { _id: req.params.id };
    const deleted = await Testimonial.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ message: "Testimonial not found." });
    res.json({ message: "Testimonial deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getTestimonials,
  getTestimonialById,
  getAdminTestimonials,
  createContentUploadUrl,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
