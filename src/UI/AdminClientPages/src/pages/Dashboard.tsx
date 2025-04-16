import "../styles/Dashboard.css";
import UserList from "../components/UserList";
import SubmissionList from "../components/SubmissionList";
import "../../../node_modules/bootstrap/dist/css/bootstrap.css"
import ProblemList from "../components/ProblemList";
function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Welcome to Admin Dashboard</h1>
      <div className="dashboard-cards">
        <div className="dashboard-card">Total Users: 120</div>
        <div className="dashboard-card">Problems Created: 30</div>
        <div className="dashboard-card">Submissions Today: 150</div>
      </div>
      <div className="dashboard_content">
      <UserList></UserList>
      <ProblemList />
      <SubmissionList></SubmissionList>
      </div>
      
    </div>
  );
}

export default Dashboard;
