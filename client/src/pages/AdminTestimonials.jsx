import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTestimonialApi, deleteTestimonialApi, getAdminTestimonials, getContentUploadUrl, updateTestimonialApi } from "../services/api";
import { getToken } from "../utils/auth";
import useAuth from "../context/AuthContext";

const MAX_MEDIA_SIZE_MB = 500;
const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;
const blank = { contentType: "story", mediaType: "text", title: "", name: "", role: "", testimony: "", linkUrl: "", videoUrl: "", featured: false, bannerEnabled: false, sitewideAdvertEnabled: false, approved: true, status: "active", seoTitle: "", seoDescription: "", image: null, video: null, audio: null };

function uploadFileWithProgress(url, options, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(options.method || "PUT", url);
    onProgress(0);
    Object.entries(options.headers || {}).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => resolve({ ok: request.status >= 200 && request.status < 300, status: request.status });
    request.onerror = () => reject(new Error("Media upload failed. Please try again."));
    request.send(options.body);
  });
}

function createVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted = true;
    video.src = objectUrl;
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 1;
      video.currentTime = Math.min(Math.max(0.5, duration * 0.1), Math.max(0.1, duration - 0.1));
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / video.videoWidth);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) resolve(new File([blob], "video-thumbnail.jpg", { type: "image/jpeg" }));
        else reject(new Error("Unable to create a video thumbnail."));
      }, "image/jpeg", 0.9);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read the selected video."));
    };
  });
}

export default function AdminTestimonials() {
  const [items, setItems] = useState([]); const [form, setForm] = useState(blank); const [mediaType, setMediaType] = useState("text"); const [editing, setEditing] = useState(null); const [message, setMessage] = useState(""); const [messageType, setMessageType] = useState(""); const [uploadProgress, setUploadProgress] = useState(null); const [isSaving, setIsSaving] = useState(false);
  const uploadFetch = (url, options) => uploadFileWithProgress(url, options, setUploadProgress);
  const fetch = uploadFetch;
  const formRef = useRef(null); const navigate = useNavigate(); const { isSubadmin } = useAuth();
  async function load() { setItems(await getAdminTestimonials(getToken())); }
  useEffect(() => { load().catch(() => { setMessageType("error"); setMessage("Unable to load content. Please refresh and try again."); }); }, []);
  useEffect(() => {
    if (!(form.video instanceof File)) return undefined;
    let cancelled = false;
    createVideoThumbnail(form.video)
      .then((thumbnail) => {
        if (!cancelled) setForm((current) => ({ ...current, image: thumbnail }));
      })
      .catch((error) => {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error.message);
        }
      });
    return () => { cancelled = true; };
  }, [form.video]);
  useEffect(() => { if (isSaving && mediaType !== "text") setMessage("Uploading"); }, [isSaving, mediaType]);
  useEffect(() => { if (uploadProgress !== null) setMessage(`Uploading ${uploadProgress}%`); }, [uploadProgress]);
  function change(event) { const { name, value, checked, type, files } = event.target; if (type === "file") { const file = files?.[0]; if (file && file.size > MAX_MEDIA_SIZE_BYTES) { setMessageType("error"); setMessage(`Please choose a file smaller than ${MAX_MEDIA_SIZE_MB} MB.`); event.target.value = ""; return; } const fieldName = name === "poster" ? "image" : mediaType; setForm((current) => ({ ...current, ...(name !== "poster" ? { image: null, video: null, audio: null } : {}), [fieldName]: file || null })); return; } setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value, ...(name === "contentType" && value === "homepage-media" ? { featured: true } : {}) })); }
  function changeMediaType(event) { const nextMediaType = event.target.value; setMediaType(nextMediaType); setForm((current) => ({ ...current, mediaType: nextMediaType, image: null, video: null, audio: null })); }
  async function submit(event) {
    event.preventDefault();
    if (isSaving) return;
    setMessage("");
    setMessageType("");
    if (mediaType === "video" && form.video instanceof File && !(form.image instanceof File)) {
      setMessageType("info");
      setMessage("Preparing video thumbnail. Please try again in a moment.");
      return;
    }
    setIsSaving(true);
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined && !["image", "video", "audio"].includes(key)) data.append(key, value);
    });
    try {
      const file = form[mediaType];
      if (file instanceof File) {
        setMessageType("info");
        setMessage("Uploading");
        const { uploadUrl, publicUrl } = await getContentUploadUrl(file, mediaType, getToken());
        const upload = await uploadFetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!upload.ok) throw new Error(`Media upload failed (storage returned ${upload.status}). Please try again.`);
        data.append(mediaType === "image" ? "image" : `${mediaType}File`, publicUrl);
      }
      if (mediaType === "video" && form.image instanceof File) {
        const { uploadUrl, publicUrl } = await getContentUploadUrl(form.image, "image", getToken());
        const upload = await uploadFetch(uploadUrl, { method: "PUT", headers: { "Content-Type": form.image.type }, body: form.image });
        if (!upload.ok) throw new Error(`Thumbnail upload failed (storage returned ${upload.status}). Please try again.`);
        data.append("image", publicUrl);
      }
      const saved = editing ? await updateTestimonialApi(editing, data, getToken()) : await createTestimonialApi(data, getToken());
      setForm(blank);
      setMediaType("text");
      setEditing(null);
      setMessageType("success");
      setMessage("Content saved. Opening the published post…");
      await load();
      window.setTimeout(() => navigate(saved.featured && saved.approved && saved.status === "active" ? "/" : "/testimonials"), 350);
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Unable to save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }
  function edit(item) { setMessage(""); setMessageType(""); setEditing(item._id); const savedMediaType = item.mediaType || (item.videoFile || item.videoUrl ? "video" : item.audioFile ? "audio" : item.image ? "image" : "text"); setMediaType(savedMediaType); setForm({ ...blank, contentType: item.contentType || "story", mediaType: savedMediaType, title: item.title || "", name: item.name || "", role: item.role || "", testimony: item.testimony || "", linkUrl: item.linkUrl || "", videoUrl: item.videoUrl || "", featured: Boolean(item.featured), bannerEnabled: Boolean(item.bannerEnabled), approved: item.approved !== false, status: item.status || "active", seoTitle: item.seoTitle || "", seoDescription: item.seoDescription || "", image: null, video: null, audio: null }); window.requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }
  async function remove(id) { if (!window.confirm("Delete this content post?")) return; try { await deleteTestimonialApi(id, getToken()); await load(); setMessageType("success"); setMessage("Content deleted."); } catch (error) { setMessageType("error"); setMessage(error.message || "Unable to delete content. Please try again."); window.scrollTo({ top: 0, behavior: "smooth" }); } }
  return <div className="page admin-testimonials"><div className="page-header"><div><span className="eyebrow">RESYIN CONTENT</span><h1>Content Studio</h1><p>{isSubadmin ? "Submit announcements, stories, outreach, journeys, or promotional media for admin review." : "Publish announcements, stories, outreach, journeys, or promotional media."}</p></div></div><form ref={formRef} className="testimonial-admin-form" onSubmit={submit}><select required name="contentType" value={form.contentType} onChange={change}><option value="announcement">Announcement</option><option value="story">Story</option><option value="outreach">Outreach activity</option><option value="journey">Journey</option><option value="testimony">Testimony</option><option value="homepage-media">Homepage promotional media</option></select><input name="title" placeholder="Post title" value={form.title} onChange={change} /><input required name="name" placeholder="Name or organisation" value={form.name} onChange={change} /><input name="role" placeholder="Role or location (optional)" value={form.role} onChange={change} /><textarea required name="testimony" placeholder="Post content or media description" rows="5" value={form.testimony} onChange={change} /><label>Media type<select value={mediaType} onChange={changeMediaType}><option value="text">Text</option><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option></select></label>{mediaType !== "text" && <label>{mediaType[0].toUpperCase() + mediaType.slice(1)} upload (maximum {MAX_MEDIA_SIZE_MB} MB)<input key={mediaType} type="file" name={mediaType} accept={`${mediaType}/*`} onChange={change} /></label>}{mediaType === "video" && <input name="videoUrl" placeholder="External YouTube/Vimeo URL (optional)" value={form.videoUrl} onChange={change} />}<input name="linkUrl" placeholder="Post link (optional)" value={form.linkUrl} onChange={change} /><input name="seoTitle" placeholder="SEO title" value={form.seoTitle} onChange={change} /><textarea name="seoDescription" placeholder="SEO description" rows="3" value={form.seoDescription} onChange={change} />{!isSubadmin && <><label className="wizard-checkbox"><input type="checkbox" name="featured" checked={form.featured} onChange={change} /> Feature on Home</label><label className="wizard-checkbox"><input type="checkbox" name="bannerEnabled" checked={form.bannerEnabled} onChange={change} /> Show as sitewide announcement (maximum 3)</label><label className="wizard-checkbox"><input type="checkbox" name="approved" checked={form.approved} onChange={change} /> Approved and visible</label></>}<button className="primary" disabled={isSaving}>{isSaving ? "Saving…" : editing ? "Update content" : isSubadmin ? "Submit for admin review" : "Publish content"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); setMediaType("text"); }}>Cancel edit</button>}{message && <p className={`content-studio-message ${messageType}`}>{message}</p>}</form><div className="admin-testimonial-list">{items.map((item) => <article className="testimonial-admin-item content-card" key={item._id}><div><strong>{item.title || item.contentType}</strong><span>{item.name} · {item.contentType}</span><p>{item.testimony}</p><small>{item.featured ? "Featured on Home" : "Content Studio only"} · {item.bannerEnabled ? "Banner" : "No banner"} · {item.approved ? "Visible" : "Awaiting review"}</small></div><div><button type="button" onClick={() => edit(item)}>Edit</button><button type="button" className="btn-danger" onClick={() => remove(item._id)}>Delete</button></div></article>)}</div></div>;
}
