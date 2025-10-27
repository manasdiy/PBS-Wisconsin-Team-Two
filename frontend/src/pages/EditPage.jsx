import Sidebar from "../components/Sidebar";
import "./EditPage.css";

export default function EditPage() {
  return (
    <div className="edit-page">
      <Sidebar />

      <div className="edit-main">
        <h1>Edit Page</h1>
        <p>This is where the editing interface will go.</p>

        <div className="edit-controls">
          <button className="save-btn">Save</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}
