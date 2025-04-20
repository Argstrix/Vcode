import { Link } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <ul className="listgroup">
        <li className="listgroupitem">
          <Link to="/">Dashboard</Link>
        </li>
        <li className="listgroupitem">
          <Link to="/manage-problem">Manage Problems</Link>
        </li>
        <li className="listgroupitem">
          <Link to="/submissions">Submissions</Link>
        </li>
        <li className="listgroupitem">
          <Link to="/analytics">User Analytics</Link>
        </li>
        <li className="listgroupitem">
          <Link to="/settings">Settings</Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
