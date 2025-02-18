const express = require("express");
const fs = require("fs");
const https = require("https");
const net = require("net");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for frontend requests

const JAVA_SERVER_HOST = "localhost";
const JAVA_SERVER_PORT = 5000;

// HTTPS SSL Certificates (Replace with real certs)
const options = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.crt"),
};

// API Route to Run Test
app.post("/runTest", (req, res) => {
    const { testId } = req.body;
    if (!testId) return res.status(400).json({ error: "testId is required" });

    // Connect to Java TCP Server
    const client = new net.Socket();
    client.connect(JAVA_SERVER_PORT, JAVA_SERVER_HOST, () => {
        client.write(testId);
    });

    client.on("data", (data) => {
        res.json({ result: data.toString() });
        client.destroy(); // Close the connection after receiving the response
    });

    client.on("error", (err) => {
        res.status(500).json({ error: "Failed to connect to Java Server" });
    });
});

// Start HTTPS Server
https.createServer(options, app).listen(3000, () => {
    console.log("HTTPS API running on port 3000");
});
