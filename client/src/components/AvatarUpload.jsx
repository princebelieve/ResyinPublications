//client/src/components/AvatarUpload.jsx
import { useState } from "react";
import { ImagePlus } from "lucide-react";
import useAuth from "../context/AuthContext";
import { uploadAvatar } from "../services/api";

export default function AvatarUpload({ onUploaded, compact = false }) {
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();

  async function handleChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setLoading(true);

      const data = await uploadAvatar(file, token);

      onUploaded?.(data.user);

      alert("Avatar uploaded");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`avatar-upload${compact ? " avatar-upload-compact" : ""}`}>
      <label className="avatar-upload-dropzone" title="Upload profile photo">
        <input className="avatar-upload-input" type="file" accept="image/*" onChange={handleChange} disabled={loading} />
        <span className="avatar-upload-placeholder" aria-hidden="true"><ImagePlus size={28} /></span>
        <span>
          <strong>{loading ? "Uploading photo…" : compact ? "Add photo" : "Upload profile photo"}</strong>
          {!compact && <small>Choose a clear JPG, PNG, or WebP image.</small>}
        </span>
      </label>

      {loading && !compact && <p>Uploading...</p>}
    </div>
  );
}
