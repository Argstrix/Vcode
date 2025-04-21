import "../styles/ClientDashBoard.css";
import ClientProblemList from "../components/ClientProblemList";
import "../../../node_modules/bootstrap/dist/css/bootstrap.css";
import GitHubHeatmap from "../components/GitHubHeatmap.tsx";
function ClientDashboard() {
    const generateDummyData = () => {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const data = [];
        const current = new Date(oneYearAgo);

        while (current <= today) {
            const dateStr = current.toISOString().split("T")[0];
            const count = Math.floor(Math.random() * 10); // random activity count (0-9)
            data.push({ date: dateStr, count });
            current.setDate(current.getDate() + 1);
        }

        return data;
    };
    const dummyActivityData = generateDummyData();
    return (
        <div className="dashboard">
            <h1>Welcome to Client Dashboard</h1>
            <div className="dashboard-cards">
                <div className="dashboard-card">Problems Solved: 30</div>
                <div className="dashboard-card">Pending Problems: 4</div>
            </div>
            <div>
                <GitHubHeatmap activityData={dummyActivityData} />
            </div>
            <div className="dashboard_content">
                <ClientProblemList />
            </div>
        </div>
    );
}

export default ClientDashboard;
