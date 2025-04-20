import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProblemList from "./components/ProblemList";
import ManageProblem from "./components/ManageProblem";
import SubmissionList from "./components/SubmissionList";
import Dashboard from "./pages/Dashboard";
import EditProblem from "./components/EditProblem";
import ClientDashBoard from "./pages/ClientDashBoard";
import ClientLayout from "./components/ClientLayout";
import ProblemPage from "./components/ProblemPage";
import ClientProblemList from "./components/ClientProblemList";
import AddProblem from "./components/AddProblem";
import { useUser } from "./context/UserContext"; // ✅ using context
import ClientSubmissions from "./components/ClientSubmissions";
import SubmissionDetails from "./components/SubmissionDetails";

function App() {
    const { role } = useUser(); // ✅ use inside the function
    
    const isAdmin = () => role === "teacher";
    const isStudent = () => role === "student";

    return (
        <Router>
            <Routes>
                {isAdmin() ? (
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
                        <Route path="/editProblem/:id" element={<EditProblem />} />
                        <Route path="add-problem" element={<AddProblem />} />
                    </Route>
                ) : isStudent() ? (
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
                        <Route
                        path = "client-submissions"
                        element = {<ClientSubmissions/>}
                        />
                        <Route path="/submission/:id" 
                        element={<SubmissionDetails />} />

                    </Route>
                ) : (
                    // fallback if role is invalid
                    <Route path="*" element={<div>Unauthorized or unknown role</div>} />
                )}
            </Routes>
        </Router>
    );
}

export default App;
        