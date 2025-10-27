import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger icon */}
      <span className="menu-btn" onClick={() => setIsOpen(true)}>
        ☰
      </span>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          ×
        </button>

        {/* Navigation links */}
        <a href="/home.html" onClick={() => setIsOpen(false)}>
          Home
        </a>
        <a href="/finished.html" onClick={() => setIsOpen(false)}>
          Finished Files
        </a>
        <a href="/editing.html" onClick={() => setIsOpen(false)}>
          Editing Page
        </a>
      </div>
    </>
  );
};

export default Sidebar;
}
