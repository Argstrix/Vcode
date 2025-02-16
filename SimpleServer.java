import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

public class SimpleServer {
    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/", new FileHandler());
        server.createContext("/hello", new GetHandler());
        server.createContext("/postdata", new PostHandler());

        server.setExecutor(null);
        server.start();
        System.out.println("Server running at http://localhost:8080");
    }
}

// Serves static HTML files
class FileHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        File file = new File("./Client_Server/index.html");

        // Debugging: Print absolute path Java is looking for
        //System.out.println("Looking for index.html at: " + file.getAbsolutePath());

        if (!file.exists()) {
            String errorMessage = "404 Not Found: index.html missing";
            exchange.sendResponseHeaders(404, errorMessage.length());
            OutputStream os = exchange.getResponseBody();
            os.write(errorMessage.getBytes());
            os.close();
            return;
        }

        byte[] fileBytes = new byte[(int) file.length()];
        FileInputStream fis = new FileInputStream(file);
        fis.read(fileBytes);
        fis.close();

        exchange.sendResponseHeaders(200, fileBytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(fileBytes);
        os.close();
    }
}



// Handles GET requests
class GetHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String response = "Hello from the Java Server!";
        exchange.sendResponseHeaders(200, response.length());
        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }
}

// Handles POST requests
class PostHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(405, -1);
            return;
        }

        InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
        BufferedReader br = new BufferedReader(isr);
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            requestBody.append(line);
        }
        br.close();

        String response = "Received Data: " + requestBody;
        exchange.sendResponseHeaders(200, response.length());

        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }
}
