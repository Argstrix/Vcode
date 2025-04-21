import "../styles/ClientAnalysis.css";
import GitHubHeatmap from "./GitHubHeatmap";

function ClientAnalysis() {
  const activityData = [
    { date: "2024-06-15", count: 5 },
    { date: "2024-07-03", count: 8 },
    { date: "2024-08-22", count: 3 },
    { date: "2024-09-10", count: 12 },
    { date: "2024-10-05", count: 7 },
    { date: "2024-11-18", count: 9 },
    { date: "2024-12-25", count: 4 },
    { date: "2025-01-30", count: 6 },
    { date: "2025-02-14", count: 15 },
    { date: "2025-03-22", count: 8 },
    { date: "2025-04-01", count: 10 },
    { date: "2025-04-15", count: 12 },
  ];
  return (
    <div className="Analysis">
      <div className="header">Analysis</div>
      <div className="Learn">
        <h2>Language Learnt</h2>
        <ul>
          <li>C++</li>
          <ul>
            <li>Vectors</li>
            <li>Trees</li>
          </ul>
        </ul>
      </div>
      <br></br>
      <div className="Heatmap">
        <h1>My Activity History</h1>
        <GitHubHeatmap
          activityData={activityData}
          startDate="2024-04-01"
          endDate="2025-04-20"
        />
      </div>
    </div>
  );
}
export default ClientAnalysis;
