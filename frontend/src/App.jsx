import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import FileGrid from "./components/FileGrid";
import EditPage from "./pages/EditPage";
import "./App.css";

export default function App() {
  const [currentPage, setCurrentPage] = useState("finished");

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <div className="main-content">
        <Topbar />
        <Routes>
          <Route path="/" element={<FileGrid />} />
          <Route path="/edit" element={<EditPage />} />
        </Routes>
        <div className="page-header">
          <h1>{currentPage === "finished" ? "Finished Files" : currentPage === "in-progress" ? "In Progress" : "Recently Deleted"}</h1>
          <div className="filter-buttons">
            <button className="filter-btn">Filter</button>
            <button className="filter-btn active">Past 2 Days ✓</button>
          </div>
        </div>
        <FileGrid currentPage={currentPage} />
      </div>
    </div>
  );
}
