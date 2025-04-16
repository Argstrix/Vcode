import AdminProblemForm from "./AdminProblemForm";

const AddProblem = () => {
    const handleAdd = (data: any) => {
        console.log("Add Problem:", data);
        // TODO: push to Firebase
    };

    return (
        <AdminProblemForm formTitle="Add New Problem" onSubmit={handleAdd} />
    );
};

export default AddProblem;
