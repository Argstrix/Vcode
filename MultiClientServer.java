import com.sun.net.httpserver.*;
import com.google.gson.*;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MultiClientServer {
    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/", new FileHandler());
        server.createContext("/compile", new CompileHandler());

        ExecutorService threadPool = Executors.newFixedThreadPool(10);
        server.setExecutor(threadPool);

        server.start();
        System.out.println("Server running at http://localhost:8080");
    }
}

// Serves index.html and other static files
class FileHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requestedFile = exchange.getRequestURI().getPath();
        System.out.println(requestedFile);

        if (requestedFile.equals("/") || requestedFile.equals("/index.html")) {
            requestedFile = "/index.html";
        }

        if (requestedFile.contains("..")) {
            sendErrorResponse(exchange, 403, "403 Forbidden: Access Denied");
            return;
        }

        File file = new File("." + requestedFile);

        if (!file.exists() || file.isDirectory()) {
            sendErrorResponse(exchange, 404, "404 Not Found: " + requestedFile);
            return;
        }

        byte[] fileBytes = new byte[(int) file.length()];
        try (FileInputStream fis = new FileInputStream(file)) {
            fis.read(fileBytes);
        }

        String contentType = "text/html";
        if (requestedFile.endsWith(".css")) contentType = "text/css";
        if (requestedFile.endsWith(".js")) contentType = "application/javascript";

        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, fileBytes.length);
        exchange.getResponseBody().write(fileBytes);
        exchange.getResponseBody().close();
    }

    private void sendErrorResponse(HttpExchange exchange, int statusCode, String message) throws IOException {
        exchange.sendResponseHeaders(statusCode, message.length());
        exchange.getResponseBody().write(message.getBytes());
        exchange.getResponseBody().close();
    }
}

// Handles Java code compilation using JavaFileCompiler
class CompileHandler implements HttpHandler {
    private static final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            sendJsonResponse(exchange, 405, "Method Not Allowed");
            return;
        }

        // Read and parse JSON request body
        InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
        BufferedReader br = new BufferedReader(isr);
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            requestBody.append(line);
        }
        br.close();

        Map<String, String> requestData;
        try {
            requestData = gson.fromJson(requestBody.toString(), Map.class);
        } catch (JsonSyntaxException e) {
            sendJsonResponse(exchange, 400, "Invalid JSON format");
            return;
        }

        String code = requestData.getOrDefault("code", "");
        String input = requestData.getOrDefault("input", "");

        if (code.isEmpty()) {
            sendJsonResponse(exchange, 400, "Missing 'code' field");
            return;
        }

        // Save Java code to a file
        String fileName = "Main.java"; // Needs to be unique for each client
        File javaFile = new File(fileName);
        try (FileWriter writer = new FileWriter(javaFile)) {
            writer.write(code);
        }

        // Use JavaFileCompiler to compile and execute Java code
        String output = JavaFileCompiler.compileAndRun(fileName, input.toString());

        sendJsonResponse(exchange, 200, output);
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, String message) throws IOException {
        String jsonResponse = gson.toJson(Map.of("message", message));
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, jsonResponse.length());
        exchange.getResponseBody().write(jsonResponse.getBytes(StandardCharsets.UTF_8));
        exchange.getResponseBody().close();
    }
}
