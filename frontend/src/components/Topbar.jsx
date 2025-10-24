import "./Topbar.css";

export default function Topbar({ currentPage }) {
  const getPageTitle = () => {
    switch (currentPage) {
      case "finished":
        return "Finished Files";
      case "in-progress":
        return "In Progress";
      case "deleted":
        return "Recently Deleted";
      default:
        return "Finished Files";
    }
  };

  return (
    <div className="topbar">
      <h1>{getPageTitle()}</h1>
      <div className="filter-buttons">
        <button className="filter-btn">Filter</button>
      </div>
    </div>
  );
}
