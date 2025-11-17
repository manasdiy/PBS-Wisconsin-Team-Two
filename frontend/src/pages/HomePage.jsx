// HomePage.jsx
import "./HomePage.css";

export default function HomePage() {
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

        <div className="upload-file-background">
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
              <span className="browse">Browse</span>
            </p>
          </div>

          <div className="supported-formats-line">
            <p className="supported-formats-text">
              Supported formats: MP3, WAV
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta">
        <button className="cta-button" type="button">
          <span className="label">Upload Files</span>
        </button>
      </div>
    </div>
  );
}
