import "./Sidebar.css";

export default function Sidebar({ currentPage, onPageChange }) {
  const menuItems = [
    { id: "finished", label: "Finished Files", icon: "★" },
    { id: "in-progress", label: "In Progress", icon: "★" },
    { id: "deleted", label: "Recently Deleted", icon: "★" }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="hamburger-menu">☰</div>
        <div className="edit-button">✏️</div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
