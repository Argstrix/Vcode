document.addEventListener("DOMContentLoaded", function () {
    const terminalInput = document.getElementById("terminal-input");
    const commandDisplay = document.getElementById("command");
    const outputDisplay = document.getElementById("output");

    let username = "";
    let step = 0; // Step 0: Enter username, Step 1: Enter password
    let wrongPass = 0;
    terminalInput.focus();

    function printLine(text, delay = 500) {
        setTimeout(() => {
            outputDisplay.innerHTML += text + "\n";
            //window.scrollTo(0, document.body.scrollHeight);
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

    function processCommand(command) {
        if (command === "forgot --help") {
            // Redirect to forgot password page
            printLine("> Redirecting to Forgot Password page...");
            setTimeout(() => {
                window.location.href = "ForgotPass.html"; // Replace with your forgot password page URL
            }, 1000);
            return;
        }

        if (step === 0) {
            username = command;
            setTimeout(() => {
                printLine(`\n> Username accepted`);
                setTimeout(() => {
                    printLine(`> Enter password:`);
                }, 100);
            }, 200);
            step = 1;
        } else if (step === 1) {
            if (command === "password123") {
                printLine("> Access granted. Welcome, " + username + "!", 1000);
                setTimeout(() => {
                    printLine("> Initializing secure session...", 100);
                    setTimeout(() => {
                        printLine("> Connection Established.", 200);
                    }, 1000);
                }, 1500);
            } else {
                wrongPass++;
                printLine("> ERROR: Incorrect password. Try again.");
                if(wrongPass>2){
                    printLine(`> Forgot password? Type 'forgot --help' for assistance.`);
                }
            }
        }
    }

    // Add typing animation for initial text
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

document.addEventListener('DOMContentLoaded', function () {
    const modeToggle = document.getElementById('mode-toggle');
    const roleToggle = document.getElementById('role-toggle');
    const body = document.body;
    
    modeToggle.addEventListener('click', function () {
        body.classList.toggle('light-mode');
        if (body.classList.contains('light-mode')) {
            modeToggle.textContent = '🌙 Dark Mode';
        } else {
            modeToggle.textContent = '🌞 Light Mode';
        }
    });

   
});
