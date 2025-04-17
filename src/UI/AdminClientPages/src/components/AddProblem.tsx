import React from "react";
import AdminProblemForm from "./AdminProblemForm";

const AddProblem = () => {
    const handleAddSubmit = async (formData: any) => {
        const parsedId = parseInt(formData.id);
        if (isNaN(parsedId)) {
            alert("❗ Please enter a valid numeric ID.");
            return;
        }

        const payload = {
            id: parsedId,
            title: formData.title,
            diff: formData.difficulty,
            desc: formData.description,
            tags: formData.tags.split(",").map((tag: string) => tag.trim()),
            code: formData.code,
        };

        console.log("📤 Submitted Problem Data:", payload);

        try {
            const response = await fetch("http://localhost:8080/addQuestion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("✅ Question sent to server and added to Firebase!");
            } else {
                const errText = await response.text();
                console.error("❌ Server Error Response:", errText);
                alert("❌ Server failed to add question.");
            }
        } catch (error) {
            console.error("⚠️ Error sending to server:", error);
            alert("⚠️ Could not reach server.");
        }
    };

    return (
        <AdminProblemForm
            formTitle="Add New Problem"
            initialData={{
                id: "",
                title: "",
                difficulty: "",
                tags: "",
                description: "",
                code: "",
            }}
            onSubmit={handleAddSubmit}
        />
    );
};

export default AddProblem;
