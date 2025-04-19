import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import com.google.gson.*;
import com.google.gson.reflect.TypeToken;
import javax.lang.model.util.Elements;

public class Server {
    protected static final ConcurrentHashMap<String, String> userRoles = new ConcurrentHashMap<>();
    protected static final Set<String> allowedOrigins = Set.of(
            "https://your-frontend.com", // Production frontend
            "https://admin-panel.yourdomain.com", // Admin panel
            "http://localhost:9000", // Local development frontend
            "http://127.0.0.1:9000",
            "http://localhost:5173" // Alternative local address
            );

    public static void main(String[] args) throws IOException {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        ServerSocket serverSocket = new ServerSocket(port);
        System.out.println("Server running on port " + port);

        while (true) {
            Socket clientSocket = serverSocket.accept();
            new Thread(new ClientHandler(clientSocket)).start();
        }
    }
}

class ClientHandler implements Runnable {
    private final Socket clientSocket;
    private static final String SOURCE_FILE1 = "Main.java";
    private static final String SOURCE_FILE2 = "main.py";

    public ClientHandler(Socket socket) {
        this.clientSocket = socket;
    }

    @Override
    public void run() {
        try (
                BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                BufferedWriter out = new BufferedWriter(new OutputStreamWriter(clientSocket.getOutputStream()))) {

            String requestLine = in.readLine();
            if (requestLine == null || requestLine.isEmpty())
                return;

            String[] requestParts = requestLine.split(" ");
            String method = requestParts[0];
            String path = requestParts[1];

            Map<String, String> headers = new HashMap<>();
            String line;
            int contentLength = 0;

            while (!(line = in.readLine()).isEmpty()) {
                int separatorIndex = line.indexOf(":");
                if (separatorIndex != -1) {
                    String headerName = line.substring(0, separatorIndex).trim();
                    String headerValue = line.substring(separatorIndex + 1).trim();
                    headers.put(headerName, headerValue);
                    if (headerName.equalsIgnoreCase("Content-Length")) {
                        contentLength = Integer.parseInt(headerValue);
                    }
                }
            }

            StringBuilder requestBodyBuilder = new StringBuilder();
            if (contentLength > 0) {
                char[] bodyChars = new char[contentLength];
                in.read(bodyChars);
                requestBodyBuilder.append(bodyChars);
            }
            String requestBody = requestBodyBuilder.toString();

            System.out.println("Received: " + method + " " + path);
            String origin = headers.get("Origin");
            System.out.println(origin);

            // Handle CORS preflight
            if (method.equals("OPTIONS")) {

                sendCorsPreflightResponse(out, origin);
                return;
            }

            try {
                if (method.equals("POST") && path.equals("/store-role")) {
                    JsonObject jsonObject = JsonParser.parseString(requestBody.toString()).getAsJsonObject();
                    String email = jsonObject.get("email").getAsString();
                    String role = jsonObject.get("role").getAsString();
                    int backendPort = jsonObject.get("port").getAsInt();

                    Server.userRoles.put(email, role);
                    System.out.println("Stored Role: " + email + " -> " + role);

                    // Build JSON response payload
                    Map<String, Object> responseBody = new HashMap<>();
                    String serverIp = clientSocket.getLocalAddress().getHostAddress();
                    //responseBody.put("redirect", "http://" + "localhost" + ":9001/");
                    responseBody.put("setCookies", new String[] {
                            "userEmail=" + URLEncoder.encode(email, "UTF-8") + "; Path=/; HttpOnly",
                            "userRole=" + URLEncoder.encode(role, "UTF-8") + "; Path=/; HttpOnly",
                            "backendPort=" + backendPort + "; Path=/; HttpOnly"
                    });
                    // Use your existing helper
                    System.out.println(responseBody);
                    sendJsonResponse(out, 200, responseBody, origin);

                } else if (method.equals("GET") && path.equals("/submissions")) {
                    List<Map<String, String>> submissions = readSubmissionsFromFirebase();
                    sendJsonResponse(out, 200, submissions);

                } else if (method.equals("POST") && path.equals("/submitCode")) {
                    JsonObject jsonObject = JsonParser.parseString(requestBody).getAsJsonObject();
                    String code = jsonObject.get("code").getAsString();
                    String problemId = jsonObject.get("problemId").getAsString();
                    String language = jsonObject.get("language").getAsString().toLowerCase();
                
                    String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
                    String clientIP = clientSocket.getInetAddress().getHostAddress();
                
                    // Save the submission
                    Map<String, String> submission = new HashMap<>();
                    submission.put("code", code);
                    submission.put("timestamp", timestamp);
                    submission.put("ip", clientIP);
                    submission.put("language", language);
                    pushSubmissionToFirebase(submission);
                
                    try {
                        switch (language) {
                            case "java" -> {
                                String filePath = "Main.java";
                                try (FileWriter writer = new FileWriter(filePath)) {
                                    writer.write(code);
                                }
                                handleCodeSubmissionAndCheck(filePath, problemId, out);
                            }
                
                            case "python" -> {
                                String filePath = "main.py";
                                try (FileWriter writer = new FileWriter(filePath)) {
                                    writer.write(code);
                                }
                                handlePythonSubmissionAndCheck(filePath, problemId, out);
                            }
                
                            default -> {
                                sendJsonResponse(out, 400, Map.of("error", "Unsupported language: " + language));
                            }
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                        sendJsonResponse(out, 500, Map.of("error", "Server error: " + e.getMessage()));
                    }
                }else if (method.equals("DELETE") && path.equals("/clearSingleSubmissions")) {
                    JsonObject jsonObject = JsonParser.parseString(requestBody).getAsJsonObject();
                    String timestamp = jsonObject.get("timestamp").getAsString();
                    deleteSingleSubmissionFromFirebase(timestamp);
                    sendJsonResponse(out, 200, Map.of("message", "Submission deleted successfully"));

                } else if (method.equals("DELETE") && path.equals("/clearSubmissions")) {
                    clearSubmissionsOnFirebase();
                    sendJsonResponse(out, 200, Map.of("message", "All submissions cleared"));

                } else if (method.equals("GET") && path.startsWith("/question")) {
                    String[] pathParts = path.split("/");

                    if (pathParts.length == 2) {
                        // No ID provided, fetch all questions
                        List<Map<String, Object>> questions = readQuestionsFromFirebase();
                        sendJsonResponse(out, 200, questions);
                    } else if (pathParts.length == 3) {
                        // Fetch a specific question by ID
                        String questionId = pathParts[2];
                        Map<String, Object> question = getQuestionByIdFromFirebase(questionId);
                        if (question != null) {
                            sendJsonResponse(out, 200, question);
                        } else {
                            sendJsonResponse(out, 404, Map.of("error", "Question not found"));
                        }
                    } else {
                        sendJsonResponsew(clientSocket, 400, Map.of("error", "Invalid request format"));
                    }
                } else if (method.equals("POST") && path.equals("/compile")) {
                    JsonObject jsonObject = JsonParser.parseString(requestBody).getAsJsonObject();
                    String code = jsonObject.get("code").getAsString();
                    String language = jsonObject.get("language").getAsString().toLowerCase();
                
                    JsonElement testInputElement = jsonObject.get("testInput");
                    String testInput = (testInputElement != null && !testInputElement.isJsonNull())
                            ? testInputElement.getAsString()
                            : "";
                
                    String output = "";
                
                    try {
                        switch (language) {
                            case "java" -> {
                                String javaFile = "Main.java";
                                try (FileWriter writer = new FileWriter(javaFile)) {
                                    writer.write(code);
                                }
                                output = JavaFileCompiler.compileAndRun(javaFile, testInput);
                            }
                
                            case "python" -> {
                                String pythonFile = "main.py";
                                try (FileWriter writer = new FileWriter(pythonFile)) {
                                    writer.write(code);
                                }
                                output = PythonCompilerRunner.run(pythonFile, testInput);
                            }
                
                            default -> {
                                output = "Unsupported language: " + language;
                            }
                        }
                
                        System.out.println(output);
                        sendJsonResponse(out, 200, Map.of("output", output));
                
                    } catch (IOException | InterruptedException e) {
                        e.printStackTrace();
                        sendJsonResponse(out, 500, Map.of("error", "Server error: " + e.getMessage()));
                    }
                }else if (method.equals("POST") && path.equals("/addQuestion")) {
                    try {
                        System.out.println("Received /addQuestion request with body: " + requestBody);
                        JsonObject jsonObject = JsonParser.parseString(requestBody).getAsJsonObject();
                
                        Map<String, Object> question = new HashMap<>();
                        question.put("id", jsonObject.get("id").getAsInt());
                        question.put("title", jsonObject.get("title").getAsString());
                        question.put("diff", jsonObject.get("diff").getAsString());
                        question.put("desc", jsonObject.get("desc").getAsString());
                        question.put("code", jsonObject.get("code").getAsString());
                        question.put("desc", jsonObject.get("desc").getAsString());
                        question.put("cases", jsonObject.get("cases").getAsString());
                        
                        List<String> tags = new ArrayList<>();
                        JsonArray tagsArray = jsonObject.get("tags").getAsJsonArray();
                        for (JsonElement element : tagsArray) {
                            tags.add(element.getAsString());
                        }
                        question.put("tags", tags);
                
                        System.out.println("Parsed question: " + question);
                
                        boolean success = addQuestionToFirebase(question);
                        if (success) {
                            sendJsonResponse(out, 200, Map.of("message", "Question added successfully"));
                        } else {
                            System.err.println("Failed to add question in addQuestionToFirebase()");
                            sendJsonResponse(out, 500, Map.of("error", "Failed to add question"));
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        sendJsonResponse(out, 500, Map.of("error", "Exception while adding question"));
                    }
                }else {
                    sendJsonResponse(out, 404, Map.of("error", "Not Found"));
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendJsonResponse(out, 500, Map.of("error", "Internal Server Error"));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // =================== Firebase Interactions ===================

    private List<Map<String, String>> readSubmissionsFromFirebase() {
        List<Map<String, String>> submissions = new ArrayList<>();
        try {
            URL url = new URL("https://vcode-3b099-default-rtdb.asia-southeast1.firebasedatabase.app/submissions.json");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            if (conn.getResponseCode() == 200) {
                try (InputStreamReader reader = new InputStreamReader(conn.getInputStream())) {
                    JsonObject jsonObject = JsonParser.parseReader(reader).getAsJsonObject();
                    System.out.println("Firebase JSON Response: " + jsonObject);
                    for (Map.Entry<String, JsonElement> entry : jsonObject.entrySet()) {
                        Map<String, String> submission = new Gson().fromJson(entry.getValue(),
                                new TypeToken<Map<String, String>>() {
                                }.getType());
                        submissions.add(submission);

                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return submissions;
    }

    private List<Map<String, Object>> readQuestionsFromFirebase() {
        List<Map<String, Object>> questions = new ArrayList<>();
        try {
            URL url = new URL("https://vcode-3b099-default-rtdb.asia-southeast1.firebasedatabase.app/questions.json");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            if (conn.getResponseCode() == 200) {
                try (InputStreamReader reader = new InputStreamReader(conn.getInputStream())) {
                    JsonElement jsonElement = JsonParser.parseReader(reader);

                    if (jsonElement.isJsonArray()) {
                        // Handle JSON array response
                        JsonArray jsonArray = jsonElement.getAsJsonArray();
                        for (JsonElement element : jsonArray) {
                            if (element != null && !element.isJsonNull()) { // Ignore null values
                                Map<String, Object> question = new Gson().fromJson(element,
                                        new TypeToken<Map<String, Object>>() {
                                        }.getType());
                                questions.add(question);
                            }
                        }
                    } else if (jsonElement.isJsonObject()) {
                        // Handle JSON object response (default Firebase structure)
                        JsonObject jsonObject = jsonElement.getAsJsonObject();
                        for (Map.Entry<String, JsonElement> entry : jsonObject.entrySet()) {
                            Map<String, Object> question = new Gson().fromJson(entry.getValue(),
                                    new TypeToken<Map<String, Object>>() {
                                    }.getType());
                            questions.add(question);
                        }
                    } else {
                        System.err.println("Unexpected JSON format received.");
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return questions;
    }
    
    public boolean addQuestionToFirebase(Map<String, Object> questionData) {
        try {
            URL url = new URL("https://vcode-3b099-default-rtdb.asia-southeast1.firebasedatabase.app/questions.json");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setDoOutput(true);
            System.out.print(questionData);
            String jsonInput = new Gson().toJson(questionData);
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInput.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
    
            int responseCode = conn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
                System.out.println("✅ Question added successfully.");
                return true;
            } else {
                System.err.println("Failed to add question. Response code: " + responseCode);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return false;
    }
    

    private void pushSubmissionToFirebase(Map<String, String> submission) {
        try {
            URL url = new URL("https://vcode-3b099-default-rtdb.asia-southeast1.firebasedatabase.app/submissions.json");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            String json = new Gson().toJson(submission);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }

            conn.getResponseCode();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void deleteSingleSubmissionFromFirebase(String timestampToDelete) {
        List<Map<String, String>> submissions = readSubmissionsFromFirebase();
        for (Map<String, String> submission : submissions) {
            if (timestampToDelete.equals(submission.get("timestamp"))) {
                String firebaseKey = submission.get("firebaseKey");
                try {
                    URL url = new URL(
                            "https://vcode-99b20-default-rtdb.asia-southeast1.firebasedatabase.app/submissions/"
                                    + firebaseKey + ".json");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("DELETE");
                    conn.getResponseCode();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                break;
            }
        }
    }

    private void clearSubmissionsOnFirebase() {
        try {
            URL url = new URL("https://vcode-99b20-default-rtdb.asia-southeast1.firebasedatabase.app/submissions.json");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PUT");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            try (OutputStream os = conn.getOutputStream()) {
                os.write("{}".getBytes(StandardCharsets.UTF_8)); // Empty object to delete all submissions
            }

            conn.getResponseCode();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private JsonObject fetchQuestionFromFirebase() {
        try {
            URL url = new URL("https://vcode-99b20-default-rtdb.asia-southeast1.firebasedatabase.app/question.json");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            if (conn.getResponseCode() == 200) {
                try (InputStreamReader reader = new InputStreamReader(conn.getInputStream())) {
                    return JsonParser.parseReader(reader).getAsJsonObject();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return new JsonObject();
    }

    private Map<String, Object> getQuestionByIdFromFirebase(String questionId) {
        try {
            String urlString = "https://vcode-3b099-default-rtdb.asia-southeast1.firebasedatabase.app/questions/"
                    + questionId + ".json";
            System.out.println("Fetching question from: " + urlString);

            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            int responseCode = conn.getResponseCode();
            System.out.println("Response Code: " + responseCode);

            if (responseCode == 200) {
                try (InputStreamReader reader = new InputStreamReader(conn.getInputStream())) {
                    JsonElement jsonElement = JsonParser.parseReader(reader);

                    if (jsonElement != null && !jsonElement.isJsonNull()) {
                        Map<String, Object> question = new Gson().fromJson(jsonElement,
                                new TypeToken<Map<String, Object>>() {
                                }.getType());

                        // System.out.println("Fetched Question: " + question); // Debug Print
                        return question;
                    } else {
                        System.out.println("Received null or empty response from Firebase.");
                    }
                }
            } else {
                System.out.println("Failed to fetch question. HTTP Response Code: " + responseCode);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        System.out.println("Returning null: Question not found or an error occurred.");
        return null; // Return null if the question is not found
    }

    public List<String> getTestCasesFromQuestion(Map<String, Object> question) {
        Object casesObj = question.get("cases");

        List<String> testCases = new ArrayList<>();
        if (casesObj instanceof List<?>) {
            for (Object o : (List<?>) casesObj) {
                if (o instanceof String) {
                    testCases.add((String) o);
                }
            }
        }

        return testCases;
    }

    // =================== Response Utilities ===================

    private void sendJsonResponse(BufferedWriter out, int statusCode, Object body) throws IOException {
        Gson gson = new Gson();
        String json = gson.toJson(body);

        out.write("HTTP/1.1 " + statusCode + " OK\r\n");
        out.write("Content-Type: application/json\r\n");
        out.write("Access-Control-Allow-Origin: *\r\n");
        out.write("Access-Control-Allow-Credentials: true\r\n");
        out.write("Content-Length: " + json.getBytes(StandardCharsets.UTF_8).length + "\r\n");
        out.write("\r\n");
        out.write(json);
        out.flush();
    }

    private void sendJsonResponse(BufferedWriter out, int statusCode, Object body, String origin) throws IOException {
        Gson gson = new Gson();
        String json = gson.toJson(body);
        out.write("HTTP/1.1 " + statusCode + " OK\r\n");
        if (Server.allowedOrigins.contains(origin)) {
            out.write("Access-Control-Allow-Origin: " + origin + "\r\n");
        } else {
            out.write("Access-Control-Allow-Origin: null\r\n"); // Or send an error if invalid
        }
        out.write("Access-Control-Allow-Credentials: true\r\n");
        out.write("Content-Type: application/json\r\n");
        out.write("Content-Length: " + json.getBytes(StandardCharsets.UTF_8).length + "\r\n");
        out.write("\r\n");
        out.write(json);
        out.flush();
    }

    private void sendJsonResponsew(Socket clientSocket, int statusCode, Object body) throws IOException {
        Gson gson = new Gson();
        String json = gson.toJson(body);
        byte[] responseBody = json.getBytes(StandardCharsets.UTF_8);

        OutputStream out = clientSocket.getOutputStream();
        String headers = "HTTP/1.1 " + statusCode + " OK\r\n"
                + "Content-Type: application/json\r\n"
                + "Access-Control-Allow-Origin: *\r\n"
                + "Content-Length: " + responseBody.length + "\r\n"
                + "\r\n";

        out.write(headers.getBytes(StandardCharsets.UTF_8)); // Write headers
        out.write(responseBody); // Write JSON response
        out.flush();
        clientSocket.close(); // Ensure connection is properly closed
    }

    private static void sendCorsPreflightResponse(BufferedWriter out, String origin) throws IOException {
        out.write("HTTP/1.1 204 No Content\r\n");
        if (Server.allowedOrigins.contains(origin)) {
            out.write("Access-Control-Allow-Origin: " + origin + "\r\n");
            out.write("Access-Control-Allow-Credentials: true\r\n");
        } else {
            out.write("Access-Control-Allow-Origin: null\r\n"); // Or send an error if invalid
        }
        out.write("Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n");
        out.write("Access-Control-Allow-Headers: Content-Type\r\n");
        out.write("Access-Control-Max-Age: 86400\r\n");
        out.write("\r\n");
        out.flush();
    }

    private void handleCodeSubmissionAndCheck(String code, String problemId, BufferedWriter out) {
        final String SOURCE_FILE = "Main.java";
    
        Map<String, Object> question = getQuestionByIdFromFirebase(problemId);
        if (question == null || !question.containsKey("cases") || !question.containsKey("code")) {
            try {
                sendJsonResponse(out, 404, Map.of("message", "Problem not found or incomplete."));
            } catch (IOException e) {
                e.printStackTrace();
            }
            return;
        }
    
        List<String> testCases = (List<String>) question.get("cases");
        System.out.println(testCases);
        String expectedCode = question.get("code").toString();
        
        int passed = 0;
        StringBuilder resultBuilder = new StringBuilder();
    
        for (int i = 0; i < testCases.size(); i++) {
            String input = testCases.get(i);
            String testCaseNumber = String.valueOf(i + 1);  // for display
    
            try {
                // Step 1: Run expected code
                writeToFile(SOURCE_FILE, expectedCode);
                String expectedOutput = JavaFileCompiler.compileAndRun(SOURCE_FILE, input).trim();
    
                // Step 2: Run submitted code
                writeToFile(SOURCE_FILE, code);
                String actualOutput = JavaFileCompiler.compileAndRun(SOURCE_FILE, input).trim();
    
                // Step 3: Compare outputs
                if (expectedOutput.equals(actualOutput)) {
                    passed++;
                    resultBuilder.append("Test ").append(testCaseNumber).append(": Success\n");
                } else {
                    resultBuilder.append("Test ").append(testCaseNumber)
                                 .append(": Failed (Expected: ")
                                 .append(expectedOutput).append(", Got: ")
                                 .append(actualOutput).append(")\n");
                }
            } catch (Exception e) {
                resultBuilder.append("Test ").append(testCaseNumber)
                             .append(": Error executing code - ")
                             .append(e.getMessage()).append("\n");
            }
        }
    
        String summary = "Passed " + passed + "/" + testCases.size() + " test cases.\n\n";
        resultBuilder.insert(0, summary);
    
        try {
            sendJsonResponse(out, 200, Map.of("result", resultBuilder.toString()));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void handlePythonSubmissionAndCheck(String code, String problemId, BufferedWriter out) {
        final String SOURCE_FILE = "main.py";
    
        Map<String, Object> question = getQuestionByIdFromFirebase(problemId);
        if (question == null || !question.containsKey("cases") || !question.containsKey("code")) {
            try {
                sendJsonResponse(out, 404, Map.of("message", "Problem not found or incomplete."));
            } catch (IOException e) {
                e.printStackTrace();
            }
            return;
        }
    
        List<String> testCases = (List<String>) question.get("cases");
        System.out.println(testCases);
        String expectedCode = question.get("code").toString();
    
        int passed = 0;
        StringBuilder resultBuilder = new StringBuilder();
    
        for (int i = 0; i < testCases.size(); i++) {
            String input = testCases.get(i);
            String testCaseNumber = String.valueOf(i + 1);
    
            try {
                // Step 1: Run expected Python code
                writeToFile(SOURCE_FILE, expectedCode);
                String expectedOutput = JavaFileCompiler.compileAndRun("Main.java", input).trim();
    
                // Step 2: Run submitted Python code
                writeToFile(SOURCE_FILE, code);
                String actualOutput = PythonCompilerRunner.run(SOURCE_FILE, input).trim();
    
                // Step 3: Compare outputs
                if (expectedOutput.equals(actualOutput)) {
                    passed++;
                    resultBuilder.append("Test ").append(testCaseNumber).append(": Success\n");
                } else {
                    resultBuilder.append("Test ").append(testCaseNumber)
                            .append(": Failed (Expected: ")
                            .append(expectedOutput).append(", Got: ")
                            .append(actualOutput).append(")\n");
                }
            } catch (Exception e) {
                resultBuilder.append("Test ").append(testCaseNumber)
                        .append(": Error executing code - ")
                        .append(e.getMessage()).append("\n");
            }
        }
    
        String summary = "Passed " + passed + "/" + testCases.size() + " test cases.\n\n";
        resultBuilder.insert(0, summary);
    
        try {
            sendJsonResponse(out, 200, Map.of("result", resultBuilder.toString()));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    
    

    private void writeToFile(String filename, String content) throws IOException {
        try (FileWriter writer = new FileWriter(filename)) {
            writer.write(content);
        }
    }

}
