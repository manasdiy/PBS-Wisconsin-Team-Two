import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import FileGrid from "./components/FileGrid";
import EditPage from "./pages/EditPage";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <Routes>
          <Route path="/" element={<FileGrid />} />
          <Route path="/edit" element={<EditPage />} />
        </Routes>
      </div>
    </div>
  );
}
