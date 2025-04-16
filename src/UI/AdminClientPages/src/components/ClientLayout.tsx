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

  return (
    <div className="client-layout">
      <ClientNavbar>
        <button className="theme-toggle" onClick={toggleTheme}>
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
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
