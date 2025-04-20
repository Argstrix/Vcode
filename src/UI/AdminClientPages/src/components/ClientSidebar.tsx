import { Link } from "react-router-dom";
import "../styles/Sidebar.css";

const ClientSidebar = () => {
  return (
    <div className="sidebar">
      <Link to="/" className="hover:text-green-200">
        Dashboard
      </Link>
      <Link to="/cproblems" className="hover:text-green-200">
        Problems
      </Link>
      <Link to="/submissions" className="hover:text-green-200">
        Submissions
      </Link>
      <Link to="/analysis" className="hover:text-green-200">
        Analysis
      </Link>
      <Link to="/settings" className="hover:text-green-200">
        Settings
      </Link>
    </div>
  );
};

export default ClientSidebar;
