import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../../node_modules/bootstrap/dist/css/bootstrap.css";
import "../styles/ProblemList.css";

const ClientProblemList = () => {
  const [problems, setProblems] = useState([
    { id: 1, title: "Two Sum", diff: "Easy", tags: ["Array", "HashMap"] },
    {
      id: 2,
      title: "Binary Tree Inorder Traversal",
      diff: "Medium",
      tags: ["Tree", "DFS"],
    },
    {
      id: 3,
      title: "Dijkstra's Algorithm",
      diff: "Hard",
      tags: ["Graph", "Shortest Path"],
    },
  ]);

  // Fetch problems from the backend
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch("http://localhost:8080/question", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseBody = await response.text();
        const data = JSON.parse(responseBody);
        console.log(data);
        setProblems(data);
      } catch (error) {
        console.error("❌ Error fetching problems:", error);
      }
    };

    fetchProblems();
  }, []);

  return (
    <div className="main">
      <div className="header">Challenge Yourself</div>
      <table className="problems-table">
        <thead>
          <tr>
            <th>Problem</th>
            <th>Difficulty</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem) => (
            <tr key={problem.id}>
              <td>
                <Link
                  to={`/problempage/${problem.id}`}
                  className="hover:text-green-200"
                >
                  {problem.title}
                </Link>
              </td>
              <td className={`difficulty ${problem.diff.toLowerCase()}`}>
                {problem.diff}
              </td>
              <td className="tags">
                {problem.tags?.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientProblemList;
