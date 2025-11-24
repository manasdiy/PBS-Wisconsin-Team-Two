
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import FileGrid from "./components/FileGrid";
import EditPage from "./pages/EditPage";
import HomePage from "./pages/HomePage"; // <-- new import
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Routes>
          {/* Home page */}
          <Route path="/" element={<HomePage />} />

          {/* File pages */}
          <Route path="/finished" element={<FileGrid currentPage="finished" />} />
          <Route path="/in-progress" element={<FileGrid currentPage="in-progress" />} />
          <Route path="/deleted" element={<FileGrid currentPage="deleted" />} />

          {/* Edit page */}
          <Route path="/edit" element={<EditPage />} />
        </Routes>
      </div>
    </div>
  );
}
