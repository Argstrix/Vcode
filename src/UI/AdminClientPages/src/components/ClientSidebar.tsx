import { Link } from "react-router-dom";
import "../styles/Sidebar.css";

const ClientSidebar = () => {
    return (
        <aside className="sidebar">
            <ul className="listgroup">
                <li className="listgroupitem">
                    <Link to="/">Dashboard</Link>
                </li>
                <li className="listgroupitem">
                    <Link to="/manage-problem">View Problems</Link>
                </li>
                <li className="listgroupitem">
                    <Link to="/client-submissions">Submissions</Link>
                </li>
                <li className="listgroupitem">
                    <Link to="/analytics">Performance</Link>
                </li>
                <li className="listgroupitem">
                    <Link to="/settings">Settings</Link>
                </li>
            </ul>
        </aside>
    );
};

export default ClientSidebar;
