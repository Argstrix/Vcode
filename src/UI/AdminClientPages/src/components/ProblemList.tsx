import { Link, useNavigate } from "react-router-dom";
import "../../../node_modules/bootstrap/dist/css/bootstrap.css";
import "../styles/ProblemList.css";

const ProblemList = () => {
    const navigate = useNavigate();

    const problems = [
        {
            id: 1,
            title: "Two Sum",
            difficulty: "Easy",
            tags: ["Array", "HashMap"],
        },
        {
            id: 2,
            title: "Binary Tree Inorder Traversal",
            difficulty: "Medium",
            tags: ["Tree", "DFS"],
        },
        {
            id: 3,
            title: "Dijkstra's Algorithm",
            difficulty: "Hard",
            tags: ["Graph", "Shortest Path"],
        },
    ];

    const handleEditClick = (problemId: number) => {
        navigate(`/editProblem/${problemId}`);
    };

    const handleAddProblemClick = () => {
        navigate("/add-problem");
    };

    return (
        <div className="overflow-auto">
            <h2 className="problemList-title">Problem List</h2>

            <div className="input-group mb-3">
                <span className="input-group-text bg-dark text-white">🔍</span>
                <input
                    type="text"
                    className="form-control bg-dark text-white"
                    placeholder="Search problem..."
                />
            </div>

            {/* ✅ Add Problem Button */}
            <div className="mb-4">
                <button
                    className="btn btn-success"
                    onClick={handleAddProblemClick}
                >
                    ➕ Add New Problem
                </button>
            </div>

            <ul className="list-group">
                {problems.map((problem) => (
                    <li key={problem.id}>
                        <Link to={`/manageProblem`} className="pli">
                            <div className="problem-content">
                                <strong>{problem.title}</strong>
                                <div className="difficulty">
                                    Difficulty: {problem.difficulty}
                                </div>
                                <div className="tags">
                                    {problem.tags.map((tag, index) => (
                                        <span key={index} className="tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                className="settings-btn"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent Link navigation
                                    handleEditClick(problem.id);
                                }}
                            >
                                ⚙️
                            </button>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProblemList;
