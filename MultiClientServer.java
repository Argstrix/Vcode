import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
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

// Serves index.html
class FileHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Get the requested file path
        String requestedFile = exchange.getRequestURI().getPath();
        System.out.println(requestedFile);
        // If no specific file is requested, serve index.html by default
        if (requestedFile.equals("/") || requestedFile.equals("/index.html")) {
            requestedFile = "/index.html";
        }

        // Ensure security: Prevent directory traversal attacks
        if (requestedFile.contains("..")) {
            String errorMessage = "403 Forbidden: Access Denied";
            exchange.sendResponseHeaders(403, errorMessage.length());
            exchange.getResponseBody().write(errorMessage.getBytes());
            exchange.getResponseBody().close();
            return;
        }

        // Load the requested file (e.g., client.html, admin.html)
        File file = new File("." + requestedFile);

        // If file does not exist, return 404 Not Found
        if (!file.exists() || file.isDirectory()) {
            String errorMessage = "404 Not Found: " + requestedFile;
            exchange.sendResponseHeaders(404, errorMessage.length());
            exchange.getResponseBody().write(errorMessage.getBytes());
            exchange.getResponseBody().close();
            return;
        }

        // Read the file contents
        byte[] fileBytes = new byte[(int) file.length()];
        FileInputStream fis = new FileInputStream(file);
        fis.read(fileBytes);
        fis.close();

        // Set proper content type based on file extension
        String contentType = "text/html";
        if (requestedFile.endsWith(".css")) contentType = "text/css";
        if (requestedFile.endsWith(".js")) contentType = "application/javascript";

        // Send response headers and the file content
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, fileBytes.length);
        exchange.getResponseBody().write(fileBytes);
        exchange.getResponseBody().close();
    }
}


// Handles Java code compilation using JavaFileCompiler
class CompileHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(405, -1);
            return;
        }

        // Read Java code from client
        InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
        BufferedReader br = new BufferedReader(isr);
        StringBuilder code = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            code.append(line).append("\n");
        }
        br.close();

        // Save Java code to a file
        String fileName = "Main.java"; //Needs to be different for each client
        File javaFile = new File(fileName);
        try (FileWriter writer = new FileWriter(javaFile)) {
            writer.write(code.toString());
        }

        // Use JavaFileCompiler to compile and execute Java code
        String output = JavaFileCompiler.compileAndRun(fileName);

        // Send output back to the client
        exchange.sendResponseHeaders(200, output.length());
        exchange.getResponseBody().write(output.getBytes());
        exchange.getResponseBody().close();
    }
}
