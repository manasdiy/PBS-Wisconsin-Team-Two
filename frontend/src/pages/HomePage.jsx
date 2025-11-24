// pages/HomePage.jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadMessage("");
  };

  // Handle upload to FastAPI backend
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setUploadMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadMessage("✅ File uploaded successfully!");
      } else {
        setUploadMessage("❌ Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage("⚠️ Error connecting to server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="home-main">
      {/* Heading */}
      <header className="heading-upload">
        <h1 className="heading-text">Upload</h1>
      </header>

      {/* Upload file area */}
      <section className="upload-file-area" aria-labelledby="upload-title">
        <h2 id="upload-title" className="sr-only">
          Upload file area
        </h2>

        <div
          className="upload-file-background"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
          }}
        >
          <div className="upload-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" aria-hidden="true">
              <path
                d="M7 18a5 5 0 010-10 6 6 0 0111.31 1.5A4 4 0 1118 18H7z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M12 8v7m0 0l-3-3m3 3l3-3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="drag-drop-line">
            <p className="drag-drop-text">
              <strong>Drag &amp; drop files</strong>&nbsp;or&nbsp;
              <span className="browse" onClick={handleBrowseClick}>
                Browse
              </span>
              <label htmlFor="file-upload" className="browse">
                Browse
              </label>
            </p>
          </div>

          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div className="supported-formats-line">
            <p className="supported-formats-text">
              Supported formats: MP3, WAV, OGG, AAC
            </p>
          </div>

          {selectedFile && (
            <div className="selected-file">
              <p>Selected: {selectedFile.name}</p>
            </div>
            <p style={{ fontSize: "14px", marginTop: "10px", color: "#483EA8" }}>
              Selected: {selectedFile.name}
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </section>

      {/* CTA */}
      <div className="cta">
        <button
          className="cta-button"
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
        >
          <span className="label">
            {isUploading ? "Uploading..." : "Upload Files"}
          </span>
        </button>
        {uploadMessage && (
          <p style={{ marginTop: "10px", color: "#555", fontWeight: 500 }}>
            {uploadMessage}
          </p>
        )}
      </div>
    </div>
  );
}