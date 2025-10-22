import "./Sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Finished Files</h2>
      <ul className="sidebar-links">
        <li>In Progress</li>
        <li>Recently Deleted</li>
      </ul>
    </div>
  );
}
