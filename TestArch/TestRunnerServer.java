import java.io.*;
import java.net.*;

public class TestRunnerServer {
    public static void main(String[] args) {
        int port = 5000;  // Port for TCP Server
        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("Test Runner Server listening on port " + port);
            
            while (true) {
                try (Socket clientSocket = serverSocket.accept();
                     BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                     PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true)) {

                    String testCase = in.readLine();
                    System.out.println("Received Test Case: " + testCase);

                    // Simulate running test case
                    String result = runTest(testCase);

                    out.println(result);  // Send result back
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static String runTest(String testCase) {
        // Here you can execute the test case and return the result
        return "Test " + testCase + " Passed"; // Dummy result
    }
}
