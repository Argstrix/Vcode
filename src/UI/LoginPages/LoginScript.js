document.addEventListener("DOMContentLoaded", async function () {
    const terminalInput = document.getElementById("terminal-input");
    const commandDisplay = document.getElementById("command");
    const outputDisplay = document.getElementById("output");

    let username = "";
    let step = 0; // Step 0: Enter username, Step 1: Enter password
    let wrongPass = 0;
    terminalInput.focus();
    let API_BASE_URL = "http://localhost:9000";
    // Initialize Firebase (Replace with your Firebase config)
    const firebaseConfig = {
        apiKey: "AIzaSyAd0yxPkMVoerKq6pPZvXyTbOEaMILss4A",
        authDomain: "vcode-3b099.firebaseapp.com",
        projectId: "vcode-3b099",
        storageBucket: "vcode-3b099.appspot.com",
        messagingSenderId: "230736955287",
        appId: "1:230736955287:web:926fc8df65c6386eb326d2",
        measurementId: "G-NMDL4TH3T3",
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    function printLine(text, delay = 500) {
        setTimeout(() => {
            outputDisplay.innerHTML += text + "\n";
        }, delay);
    }

    terminalInput.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            const command = terminalInput.value.trim();
            terminalInput.value = "";
            commandDisplay.textContent = "";
            processCommand(command);
        } else {
            commandDisplay.textContent = terminalInput.value;
        }
    });

    async function processCommand(command) {
        if (command === "forgot --help") {
            printLine("> Redirecting to Forgot Password page...");
            setTimeout(() => {
                window.location.href = "ForgotPass.html";
            }, 1000);
            return;
        }

        if (step === 0) {
            username = command;
            printLine(`\n> Searching for user: ${username}...`);

            const email = await fetchUserData(username);

            if (email) {
                printLine("> Username accepted");
                setTimeout(() => {
                    printLine("> Enter password:");
                    step = 1;
                    terminalInput.focus();
                }, 500);
            } else {
                printLine("> ERROR: Username not found.");
            }
        } else if (step === 1) {
            const password = command;
            console.log("Logging in with:", username, password);

            const userData = await fetchUserData(username);
            if (userData.email) {
                verifyPassword(userData.email, password, userData.role);
            } else {
                printLine("> ERROR: Could not retrieve user data.");
            }
        }
    }

    async function fetchUserData(username) {
        try {
            const querySnapshot = await db
                .collection("users")
                .where("username", "==", username)
                .get();

            if (!querySnapshot.empty) {
                let userData = null;
                querySnapshot.forEach((doc) => {
                    userData = doc.data();
                });
                console.log("Fetched user:", userData);
                return userData; // Return email
            } else {
                return null;
            }
        } catch (error) {
            printLine("> ERROR: Failed to fetch user data.");
            console.error(error);
            return null;
        }
    }

    function getBackendPort() {
        fetch(`${API_BASE_URL}/get-port`)
            .then((response) => response.json())
            .then((data) => {
                API_BASE_URL = `http://localhost:${data.port}`;
                console.log("Using backend port:", API_BASE_URL);
            })
            .catch((error) =>
                console.error("Error fetching backend port:", error)
            );
    }

    async function verifyPassword(userEmail, inputPassword, role) {
        try {
            await auth.signInWithEmailAndPassword(userEmail, inputPassword);
            printLine("> Access granted. Welcome, " + userEmail + "!");
    
            setTimeout(async () => {
                printLine("> Initializing secure session...");
    
                try {
                    // Step 1: Get backend port
                    const response = await fetch(
                        "http://localhost:9000/get-port"
                    );
                    const data = await response.json();
                    const backendURL = `http://localhost:${data.port}`;
                    console.log("Using backend port:", backendURL);

                    // Step 2: Store role
                    await fetch(backendURL + "/store-role", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: userEmail,
                            role: role,
                            port: data.port,
                        }),
                        credentials: "include",
                    });

                    // Step 3: Save data in localStorage
                    localStorage.setItem("userEmail", userEmail);
                    localStorage.setItem("userRole", role);
                    localStorage.setItem("userPort", data.port);

                    // Step 4: Change context at 9000
                    await fetch("http://localhost:9000/change-context", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            baseURL: backendURL,
                            userEmail: userEmail,
                            role: role,
                        }),
                    })
                        .then((res) => {
                            if (res.ok) {
                                // 💥 Navigate to the new app manually (React side)
                                console.log("Refreshed");
                                window.location.href = "http://localhost:9000/";
                            }
                        })
                        .catch((err) =>
                            console.error("Context change failed", err)
                        );

                    printLine("> Session data saved locally.");
                } catch (error) {
                    console.error(
                        "Error during session initialization:",
                        error
                    );
                    printLine("> ERROR: Failed to initialize session.");
                }
    
                setTimeout(() => {
                    printLine("> Connection Established.");
                }, 1000);
            }, 1500);
        } catch (error) {
            wrongPass++;
            printLine("> ERROR: Incorrect password. Try again.");
            console.error("Firebase Auth Error:", error);
            if (wrongPass > 2) {
                printLine(
                    "> Forgot password? Type 'forgot --help' for assistance."
                );
            }
        }
    }
    
    // Typing animation for initial text
    const initialText = "> Welcome to Vcode.\n> Please enter your username:";
    let index = 0;
    function typeInitialText() {
        if (index < initialText.length) {
            outputDisplay.innerHTML += initialText.charAt(index);
            index++;
            setTimeout(typeInitialText, 50);
        }
    }
    typeInitialText();
});
