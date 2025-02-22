let generatedCode = "";

document.querySelector(".reset-btn").addEventListener("click", function () {
    let email = document.getElementById("email-input").value;
    if (email.includes("@") && email.includes(".")) {
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code
        alert("Password reset code sent: " + generatedCode); // Simulating email send
        
        // Switch to step 2
        document.getElementById("step1").classList.add("hidden");
        document.getElementById("step2").classList.remove("hidden");
    } else {
        alert("Please enter a valid email address.");
    }
});

document.querySelector(".verify-btn").addEventListener("click", function () {
    let enteredCode = document.getElementById("code-input").value;
    if (enteredCode === generatedCode) {
        alert("Verification successful! Please set a new password.");
        
        // Switch to step 3
        document.getElementById("step2").classList.add("hidden");
        document.getElementById("step3").classList.remove("hidden");
    } else {
        alert("Incorrect code! Try again.");
    }
});

document.querySelector(".save-password-btn").addEventListener("click", function () {
    let newPassword = document.getElementById("new-password").value;
    let confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
    } else if (newPassword !== confirmPassword) {
        alert("Passwords do not match! Try again.");
    } else {
        alert("Password successfully updated! Redirecting to login...");
        window.location.href = "LoginPage.html"; // Redirect to login page
    }
});
