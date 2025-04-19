import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ClientNavbar from "./ClientNavbar";
import ClientSidebar from "./ClientSidebar";
import "../styles/ClientLayout.css";
import "../styles/theme.css";
import { Outlet } from "react-router-dom";

function ClientLayout() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const location = useLocation(); // Get the current route

    useEffect(() => {
        if (theme === "light") {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
        }
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const logout = () => {
        // Clear localStorage items
        localStorage.removeItem("sessionId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userPort");

        // Call server logout endpoint with credentials
        fetch("http://localhost:9000/logout", {
            method: "POST",
            credentials: "include", // Important for cookies
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (response.ok) {
                    console.log("Logged out successfully");
                    // Redirect to login page
                    window.location.href = "http://localhost:9000/";
                } else {
                    console.error("Logout failed:", response.statusText);
                    alert("Logout failed. Please try again.");
                }
            })
            .catch((error) => {
                console.error("Error during logout:", error);
                alert("Error during logout. Please try again.");

                // Fallback: redirect anyway if server is unreachable
                window.location.href = "http://localhost:9000/";
            });
    };

    return (
        <div className="client-layout">
            <ClientNavbar>
                <>
                    <button className="theme-toggle" onClick={toggleTheme}>
                        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                    </button>
                    <button className="logout-button" onClick={logout}>
                        Logout
                    </button>
                </>
            </ClientNavbar>
            <div className="main-content">
                {/* Hide sidebar only on /problempage */}
                {location.pathname !== "/problempage" && <ClientSidebar />}
                <div className="content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default ClientLayout;
