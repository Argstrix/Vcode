import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../styles/AdminLayout.css";
import "../styles/theme.css";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  // Get stored theme preference or default to dark mode
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

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
    localStorage.setItem("theme", newTheme); // Save preference
  };

  return (
    <div className="admin-layout">
      <Navbar>
        <button className="theme-toggle" onClick={toggleTheme}>
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </Navbar>
      <div className="main-content">
        <Sidebar />
        <div className="content">
          <Outlet /> 
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
