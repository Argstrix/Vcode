import { useState } from "react";
import ProblemList from "./ProblemList";
import "../styles/ManageProblem.css";
import AddProblem from "./AddProblem";

const ManageProblem = () => {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="PL-container" style={{ position: "relative" }}>
            <button
                className="top-right-btn"
                onClick={() => setShowForm(!showForm)}
            >
                {showForm ? "Close" : "Add Problem"}
            </button>
            {showForm && <AddProblem />}
            {!showForm && <ProblemList />}
        </div>
    );
};

export default ManageProblem;
