import { useState } from "react";

export default function FileUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Upload result:", data);
      onUploadComplete(); // refresh file list
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label
        style={{
          backgroundColor: "#4a3aff",
          color: "white",
          padding: "8px 16px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Upload File"}
        <input
          type="file"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}