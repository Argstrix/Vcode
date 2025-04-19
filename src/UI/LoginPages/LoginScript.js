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

    // Session Manager Class
    class SessionManager {
        constructor() {
            this.sessionId = this.getSessionId();
        }

        // Get session ID from localStorage or create a new one
        getSessionId() {
            let sessionId = localStorage.getItem("sessionId");
            if (!sessionId) {
                console.log("No session ID found in localStorage");
            } else {
                console.log("Using session ID from localStorage:", sessionId);
            }
            return sessionId;
        }

        // Save session ID to localStorage
        saveSessionId(sessionId) {
            if (sessionId) {
                localStorage.setItem("sessionId", sessionId);
                console.log("Session ID saved to localStorage:", sessionId);
                this.sessionId = sessionId;
            }
        }

        // Clear session data
        clearSession() {
            localStorage.removeItem("sessionId");
            console.log("Session cleared from localStorage");
            this.sessionId = null;
        }

        // Check if we have a session
        hasSession() {
            return !!this.sessionId;
        }
    }

    // API Client with session handling
    class ApiClient {
        constructor() {
            this.baseUrl = API_BASE_URL;
            this.sessionManager = new SessionManager();
        }

        // Get port from server
        async getPort() {
            try {
                const response = await fetch(`${this.baseUrl}/get-port`, {
                    method: "GET",
                    credentials: "include", // This ensures cookies are sent
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // If the response contains a sessionId, save it
                if (data.sessionId) {
                    this.sessionManager.saveSessionId(data.sessionId);
                }

                return data.port;
            } catch (error) {
                console.error("Error getting port:", error);
                throw error;
            }
        }

        // Change context (e.g., switch to admin pages)
        async changeContext(userData) {
            try {
                console.log("Attempting context change with data:", userData);
                console.log(this.baseUrl);
                const response = await fetch(`${this.baseUrl}/change-context`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sessionId: this.sessionManager.sessionId,
                        baseURL: userData.baseURL,
                        userEmail: userData.userEmail,
                        role: userData.role,
                    }),
                    credentials: "include", // This ensures cookies are sent
                });

                // Check if the response is OK (status in the range 200-299)
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(
                        `Server returned ${response.status}: ${errorText}`
                    );
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                // Parse the JSON response
                const data = await response.json();
                console.log("Context change response:", data);

                // If the response contains a sessionId, save it
                if (data.sessionId) {
                    this.sessionManager.saveSessionId(data.sessionId);
                    console.log("Session ID updated:", data.sessionId);
                }

                return data;
            } catch (error) {
                console.error("Error changing context:", error);
                throw error;
            }
        }
    }

    // Create instances
    const sessionManager = new SessionManager();
    const apiClient = new ApiClient();

    // Check for cookies and update localStorage if needed
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "sessionId") {
            sessionManager.saveSessionId(value);
            break;
        }
    }

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

    async function getBackendPort() {
        try {
            // Use the new apiClient instead of direct fetch
            const port = await apiClient.getPort();
            API_BASE_URL = `http://localhost:${port}`;
            console.log("Using backend port:", API_BASE_URL);
            return port;
        } catch (error) {
            console.error("Error fetching backend port:", error);
            return null;
        }
    }

    async function verifyPassword(userEmail, inputPassword, role) {
        try {
            // Step 1: Authenticate with Firebase
            await auth.signInWithEmailAndPassword(userEmail, inputPassword);
            printLine("> Access granted. Welcome, " + userEmail + "!");

            // Step 2: Initialize session (with delay for UI feedback)
            setTimeout(async () => {
                try {
                    printLine("> Initializing secure session...");

                    // Step 3: Get backend port
                    const port = await apiClient.getPort();
                    if (!port) {
                        throw new Error("Failed to get backend port");
                    }

                    const backendURL = `http://localhost:${port}`;
                    console.log("Using backend port:", backendURL);

                    // Step 4: Store role on backend
                    const roleResponse = await fetch(
                        backendURL + "/store-role",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                email: userEmail,
                                role: role,
                                port: port,
                            }),
                            credentials: "include",
                        }
                    );

                    // Check if role storage was successful
                    if (!roleResponse.ok) {
                        throw new Error(
                            `Failed to store role: ${roleResponse.status}`
                        );
                    }

                    // Step 5: Save data in localStorage
                    localStorage.setItem("userEmail", userEmail);
                    localStorage.setItem("userRole", role);
                    localStorage.setItem("userPort", port);
                    printLine("> Session data saved locally.");

                    // Step 6: Change context using the session-aware client
                    // Use proper async/await pattern instead of mixing with then/catch
                    try {
                        console.log("fetch poten pa");
                        const contextResponse = await apiClient.changeContext({
                            baseURL: backendURL,
                            userEmail: userEmail,
                            role: role,
                        });
                        console.log("fetch vandhirchu pa");
                        // Log success and redirect
                        console.log(
                            "Context changed successfully",
                            contextResponse
                        );
                        printLine("> Context switched successfully.");

                        // Add a small delay before redirecting to ensure UI updates
                        setTimeout(() => {
                            printLine("> Connection Established.");
                            printLine("> Redirecting to application...");
                            window.location.href = "http://localhost:9000/";
                        }, 1000);
                    } catch (contextError) {
                        console.error("Context change failed", contextError);
                        printLine("> ERROR: Failed to change context.");
                        throw contextError; // Re-throw to be caught by outer catch
                    }
                } catch (sessionError) {
                    console.error(
                        "Error during session initialization:",
                        sessionError
                    );
                    printLine(
                        "> ERROR: Failed to initialize session: " +
                            sessionError.message
                    );
                }
            }, 1500);
        } catch (authError) {
            wrongPass++;
            printLine("> ERROR: Incorrect password. Try again.");
            console.error("Firebase Auth Error:", authError);
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
