import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import FileGrid from "./components/FileGrid";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <FileGrid />
      </div>
    </div>
  );
}
