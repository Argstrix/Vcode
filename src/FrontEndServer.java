import java.io.*;
import java.net.*;
import java.nio.file.Files;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class FrontEndServer {
    private static final int API_PORT = 9000;
    private static final String[] SERVERS = {
        "127.0.0.1:8080"
        // "127.0.0.1:8081",
        // "127.0.0.1:8082",
        // "127.0.0.1:8083",
    };
    private static int currentServerIndex = 0;
    private static final ExecutorService threadPool = Executors.newFixedThreadPool(15);
    private static final String BASE_DIR = ".\\UI\\LoginPages";
    private static ConcurrentHashMap<Socket, String> clientBaseDirs = new ConcurrentHashMap<>();

    public static void main(String[] args) {
        try (ServerSocket apiServer = new ServerSocket(API_PORT)) {
            System.out.println("API Server running on port " + API_PORT);

            while (true) {
                Socket apiClient = apiServer.accept();
                threadPool.execute(() -> handleRequest(apiClient));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static synchronized String getNextServer() {
        String server = SERVERS[currentServerIndex];
        currentServerIndex = (currentServerIndex + 1) % SERVERS.length;
        return server;
    }

    private static void handleRequest(Socket apiClient) {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(apiClient.getInputStream()));
             OutputStream out = apiClient.getOutputStream()) {

            String request = in.readLine();
            if (request == null) {
                apiClient.close();
                return;
            }

            System.out.println("Received Request: " + request);

            // Default base directory for the client
            String currentBaseDir = clientBaseDirs.getOrDefault(apiClient, BASE_DIR);
            System.out.println("Current Base Directory: " + currentBaseDir); // Debugging log

            if (request.startsWith("GET /get-port")) {
                handleApiRequest(out);
            } else if (request.startsWith("GET / ")) {
                serveStaticFile("index.html", out, currentBaseDir);
            } else if (request.startsWith("GET /")) {
                String filePath = request.split(" ")[1].substring(1);
                if (filePath.isEmpty()) filePath = "index.html";
                serveStaticFile(filePath, out, currentBaseDir);
            } else if (request.startsWith("OPTIONS")) {
                handlePreflightRequest(out);
            } else if (request.startsWith("POST /change-context")) {
                handleChangeContext(in, out, apiClient);
            } else {
                send404(out);
            }

            apiClient.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static void handleApiRequest(OutputStream out) throws IOException {
        String server = getNextServer();
        String port = server.split(":")[1];
        String jsonResponse = "HTTP/1.1 200 OK\r\n"
                            + "Content-Type: application/json\r\n"
                            + "Access-Control-Allow-Origin: *\r\n"
                            + "Access-Control-Allow-Methods: GET, OPTIONS\r\n"
                            + "Access-Control-Allow-Headers: Content-Type\r\n"
                            + "Connection: keep-alive\r\n"
                            + "\r\n"
                            + "{ \"port\": \"" + port + "\" }";
        out.write(jsonResponse.getBytes());
        out.flush();
    }

    private static void serveStaticFile(String filePath, OutputStream out, String currentBaseDir) throws IOException {
        File file = new File(currentBaseDir, filePath);
        if (!file.exists()) {
            send404(out);
            return;
        }

        String contentType = getContentType(filePath);
        byte[] fileData = Files.readAllBytes(file.toPath());
        String header = "HTTP/1.1 200 OK\r\n"
                      + "Content-Type: " + contentType + "\r\n"
                      + "Content-Length: " + fileData.length + "\r\n"
                      + "Connection: keep-alive\r\n"
                      + "\r\n";

        out.write(header.getBytes());
        out.write(fileData);
        out.flush();
    }

    private static void handleChangeContext(BufferedReader in, OutputStream out, Socket apiClient) throws IOException {
        StringBuilder bodyBuilder = new StringBuilder();
        String line;
        int contentLength = 0;

        // Read headers to find content length
        while ((line = in.readLine()) != null && !line.isEmpty()) {
            if (line.startsWith("Content-Length:")) {
                contentLength = Integer.parseInt(line.substring("Content-Length:".length()).trim());
            }
        }

        // Read body
        for (int i = 0; i < contentLength; i++) {
            bodyBuilder.append((char) in.read());
        }

        String body = bodyBuilder.toString();
        System.out.println("Received context switch request: " + body);

        // Change base directory for this specific client
        clientBaseDirs.put(apiClient, ".\\UI\\AdminClientPages\\dist\\");

        // Debugging log to verify directory change
        System.out.println("Updated Base Directory: " + clientBaseDirs.get(apiClient));

        String response = "HTTP/1.1 200 OK\r\n"
                        + "Content-Type: application/json\r\n"
                        + "Access-Control-Allow-Origin: *\r\n"
                        + "Access-Control-Allow-Methods: POST, OPTIONS\r\n"
                        + "Access-Control-Allow-Headers: Content-Type\r\n"
                        + "\r\n"
                        + "{ \"message\": \"Context switched to AdminClientPages\" }";
        out.write(response.getBytes());
        out.flush();
    }

    private static void handlePreflightRequest(OutputStream out) throws IOException {
        String preflightResponse = "HTTP/1.1 204 No Content\r\n"
                                 + "Access-Control-Allow-Origin: *\r\n"
                                 + "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
                                 + "Access-Control-Allow-Headers: Content-Type\r\n"
                                 + "Connection: keep-alive\r\n"
                                 + "\r\n";
        out.write(preflightResponse.getBytes());
        out.flush();
    }

    private static void send404(OutputStream out) throws IOException {
        String response = "HTTP/1.1 404 Not Found\r\n"
                        + "Content-Type: text/plain\r\n"
                        + "Content-Length: 13\r\n"
                        + "\r\n"
                        + "404 Not Found";
        out.write(response.getBytes());
        out.flush();
    }

    private static String getContentType(String filePath) {
        if (filePath.endsWith(".html") || filePath.endsWith(".htm")) return "text/html";
        if (filePath.endsWith(".css")) return "text/css";
        if (filePath.endsWith(".js")) return "application/javascript";
        if (filePath.endsWith(".json")) return "application/json";
        if (filePath.endsWith(".xml")) return "application/xml";
        if (filePath.endsWith(".txt")) return "text/plain";
        if (filePath.endsWith(".csv")) return "text/csv";
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
        if (filePath.endsWith(".png")) return "image/png";
        if (filePath.endsWith(".gif")) return "image/gif";
        if (filePath.endsWith(".bmp")) return "image/bmp";
        if (filePath.endsWith(".svg")) return "image/svg+xml";
        if (filePath.endsWith(".ico")) return "image/x-icon";
        if (filePath.endsWith(".mp3")) return "audio/mpeg";
        if (filePath.endsWith(".wav")) return "audio/wav";
        if (filePath.endsWith(".ogg")) return "audio/ogg";
        if (filePath.endsWith(".mp4")) return "video/mp4";
        if (filePath.endsWith(".webm")) return "video/webm";
        if (filePath.endsWith(".avi")) return "video/x-msvideo";
        if (filePath.endsWith(".pdf")) return "application/pdf";
        if (filePath.endsWith(".zip")) return "application/zip";
        if (filePath.endsWith(".tar")) return "application/x-tar";
        if (filePath.endsWith(".gz")) return "application/gzip";
        if (filePath.endsWith(".rar")) return "application/vnd.rar";
        if (filePath.endsWith(".woff")) return "font/woff";
        if (filePath.endsWith(".woff2")) return "font/woff2";
        if (filePath.endsWith(".ttf")) return "font/ttf";
        if (filePath.endsWith(".otf")) return "font/otf";
        return "application/octet-stream";
    }
}
