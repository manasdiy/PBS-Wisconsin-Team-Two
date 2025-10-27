import "./Sidebar.css";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation(); // track current path

  return (
    <>
      <span className="menu-btn" onClick={() => setIsOpen(true)}>
        ☰
      </span>

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          ×
        </button>

        <Link 
          to="/" 
          className={location.pathname === "/" ? "active" : ""} 
          onClick={() => setIsOpen(false)}
        >
          Home
        </Link>
        <Link 
          to="/finished" 
          className={location.pathname === "/finished" ? "active" : ""} 
          onClick={() => setIsOpen(false)}
        >
          Finished Files
        </Link>
        <Link 
          to="/in-progress" 
          className={location.pathname === "/in-progress" ? "active" : ""} 
          onClick={() => setIsOpen(false)}
        >
          In Progress
        </Link>
        <Link 
          to="/deleted" 
          className={location.pathname === "/deleted" ? "active" : ""} 
          onClick={() => setIsOpen(false)}
        >
          Recently Deleted
        </Link>
      </div>
    </>
  );
};

export default Sidebar;
