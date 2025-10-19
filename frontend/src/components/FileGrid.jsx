import "./FileGrid.css";

export default function FileGrid() {
  const files = [
    { name: "Video Segment 3", edited: "Edited today" },
    { name: "Song 3", edited: "Edited yesterday" },
    { name: "Podcast 4 - 10/13", edited: "Edited 2 days ago" },
    { name: "Song 2", edited: "Edited today" },
    { name: "Video Segment 2", edited: "Edited yesterday" },
  ];

  return (
    <div className="file-grid">
      {files.map((file, i) => (
        <div className="file-card" key={i}>
          <div className="file-thumbnail"></div>
          <div className="file-info">
            <h3>{file.name}</h3>
            <p>{file.edited}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
