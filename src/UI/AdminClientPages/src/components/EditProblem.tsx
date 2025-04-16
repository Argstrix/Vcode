import { useParams } from "react-router-dom";
import AdminProblemForm from "./AdminProblemForm";

const EditProblem = () => {
    const { id } = useParams(); // Get the problem ID from URL

    // Fetch problem data from Firebase (TODO: Fetch data using `id`)
    const initialData = {
        title: "Sample Problem",
        difficulty: "Medium",
        tags: "Array, HashMap",
        description: "Solve this problem efficiently.",
        code: "// Sample code here...",
    };

    const handleSubmit = (updatedData: any) => {
        console.log("Updated Problem Data:", updatedData);
        // TODO: Update the problem in Firebase using `id`
    };

    return (
        <AdminProblemForm
            formTitle={`Edit Problem #${id}`}
            initialData={initialData}
            onSubmit={handleSubmit}
        />
    );
};

export default EditProblem;
