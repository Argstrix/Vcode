import "../styles/ClientDashBoard.css";
import "../../../node_modules/bootstrap/dist/css/bootstrap.css";
function ClientDashboard() {
  return (
    <div className="dashboard">
      <h1>Welcome to Client Dashboard</h1>
      <div className="dashboard-cards">
        <div className="dashboard-card">Problems Solved: 30</div>
        <div className="dashboard-card">Pending Problems: 4</div>
      </div>
    </div>
  );
}

export default ClientDashboard;
