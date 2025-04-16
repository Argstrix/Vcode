import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProblemList from "./components/ProblemList";
import ManageProblem from "./components/ManageProblem";
import SubmissionList from "./components/SubmissionList";
import Dashboard from "./pages/Dashboard";
import EditProblem from "./components/EditProblem";
import ClientDashBoard from "./pages/ClientDashBoard";
import ClientLayout from "./components/ClientLayout"; // Client Layout
import ProblemPage from "./components/ProblemPage";
import ClientProblemList from "./components/ClientProblemList";

// Toggle between Admin & Client by changing this variable
const isAdmin = false; // Set to `false` for client mode

function App() {
    return (
        <Router>
            <Routes>
                {isAdmin ? (
                    // Admin Routes
                    <Route path="/" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="problems" element={<ProblemList />} />
                        <Route
                            path="manage-problem"
                            element={<ManageProblem />}
                        />
                        <Route
                            path="submissions"
                            element={<SubmissionList />}
                        />
                        <Route path="analytics" element={<ManageProblem />} />
                        <Route path="settings" element={<ManageProblem />} />
                        <Route
                            path="/editProblem/:id"
                            element={<EditProblem />}
                        />
                    </Route>
                ) : (
                    // Client Routes
                    <Route path="/" element={<ClientLayout />}>
                        <Route index element={<ClientDashBoard />} />
                        <Route
                            path="cproblems"
                            element={<ClientProblemList />}
                        />
                        <Route
                            path="csubmissions"
                            element={<SubmissionList />}
                        />
                        <Route
                            path="problempage/:id"
                            element={<ProblemPage />}
                        />
                    </Route>
                )}
            </Routes>
        </Router>
    );
}

export default App;
