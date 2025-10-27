import "./FileGrid.css";
import Topbar from "./Topbar.jsx";
import { useNavigate } from "react-router-dom";

export default function FileGrid({ currentPage }) {
  const navigate = useNavigate();

  const finishedFiles = [
    { name: "Video Segment 3", edited: "Edited today" },
    { name: "Song 3", edited: "Edited yesterday" },
    { name: "Podcast 4 - 10/13", edited: "Edited 2 days ago" },
    { name: "Song 2", edited: "Edited today" },
    { name: "Video Segment 2", edited: "Edited yesterday" },
    { name: "Podcast 3 - 10/12", edited: "Edited 2 days ago" },
    { name: "Podcast 2 - 10/11", edited: "Edited 2 days ago" },
    { name: "Censored Song 1", edited: "Edited 2 days ago" },
    { name: "Video Segment 1", edited: "Edited 2 days ago" },
    { name: "Podcast 1 - 10/10", edited: "Edited 2 days ago" },
  ];

  const inProgressFiles = [
    { name: "Documentary Draft", edited: "Edited today" },
    { name: "Interview Audio", edited: "Edited today" },
    { name: "News Segment 5", edited: "Edited yesterday" },
    { name: "Background Music", edited: "Edited yesterday" },
    { name: "Podcast Intro", edited: "Edited 2 days ago" },
    { name: "Video Montage", edited: "Edited 2 days ago" },
  ];

  const deletedFiles = [
    { name: "Old Version 1", edited: "Deleted today" },
    { name: "Test File", edited: "Deleted yesterday" },
  ];

  const getFilesForPage = () => {
    switch (currentPage) {
      case "finished":
        return finishedFiles;
      case "in-progress":
        return inProgressFiles;
      case "deleted":
        return deletedFiles;
      default:
        return finishedFiles;
    }
  };

  const files = getFilesForPage();

  return (
    <div className="file-grid-container">
      <Topbar currentPage={currentPage} />
      <div className="file-grid">
        {files.map((file, i) => (
          <button
            className="file-card"
            key={i}
            onClick={() => navigate("/edit")}
          >
            <div className="file-thumbnail">
              <div className="file-icon">📄</div>
            </div>
            <div className="file-info">
              <h3>{file.name}</h3>
              <p>{file.edited}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
