import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import "../styles/ProblemPage.css";

const ProblemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get the problem ID from the URL
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("// Write your code here...");
  const [output, setOutput] = useState("No output yet...");
  const [customTest, setCustomTest] = useState("");

  // Fetch problem details from the backend
  useEffect(() => {
    const fetchProblemDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8080/question/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched problem:", data);

        // Only setting required fields
        setProblem({
          title: data.title || "No title available",
          difficulty: data.diff || "Unknown",
          description: data.desc || "No description available",
        });
      } catch (error) {
        console.error("Error fetching problem details:", error);
      }
    };

    if (id) fetchProblemDetails();
  }, [id]);

  const handleSubmitCode = async () => {
    setOutput("Submitting code...");

    const requestBody = {
      language,
      code,
      problemId: id,
    };

    try {
      const response = await fetch("http://localhost:8080/submitCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.result || "No result received from server.");
    } catch (error) {
      console.error("Error submitting code:", error);
      setOutput("Error submitting code.");
    }
  };

  const handleRunCode = async () => {
    setOutput("Running code...");

    const requestBody = {
      language,
      code,
      testInput: customTest || null,
    };

    try {
      const response = await fetch("http://localhost:8080/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      setOutput(data.output || "No output received.");
    } catch (error) {
      console.error("Error running code:", error);
      setOutput("Error running code.");
    }
  };

  return (
    <div className="problem-page">
      {problem ? (
        <>
          {/* Problem Description Section */}
          <div className="problem-container">
            <h2>{problem.title}</h2>
            <p>
              <strong>Difficulty:</strong> {problem.difficulty}
            </p>
            <div className="problem-description">
              <strong>Description:</strong>
              {problem.description
                .replace(/\\n/g, "\n") // Convert escaped newlines to actual newlines
                .split("\n")
                .map((line: string, index: number) => (
                  <p key={index}>{line}</p>
                ))}
            </div>
          </div>

          {/* Code Editor Section */}
          <div className="CodeSide">
            <select
              className="language-selector"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>

            <div className="code-editor">
              <Editor
                height="400px"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 18,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Custom Test Case Input */}
            <div className="custom-test">
              <p>
                <strong>Custom Test Cases:</strong>
              </p>
              <textarea
                placeholder="Enter custom test cases..."
                value={customTest}
                onChange={(e) => setCustomTest(e.target.value)}
              />
            </div>

            {/* Controls */}
            <div className="controls">
              <button className="btn run-btn" onClick={handleRunCode}>
                Run
              </button>
              <button className="btn submit-btn" onClick={handleSubmitCode}>
                Submit
              </button>
            </div>

            {/* Output Display */}
            <div className="output-container">
              <h3>Output:</h3>
              <pre>{output}</pre>
            </div>
          </div>
        </>
      ) : (
        <p>Loading problem details...</p>
      )}
    </div>
  );
};

export default ProblemPage;
