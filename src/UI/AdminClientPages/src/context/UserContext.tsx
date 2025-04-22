import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
    email: string | null;
    role: "teacher" | "student" | null;
    port: string | null;
    hostIP: string;
    userName: string; // Changed to always be a string
}

const UserContext = createContext<UserContextType>({
    email: null,
    role: null,
    port: null,
    hostIP: "192.168.67.185",
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<"teacher" | "student" | null>(null);
    const [port, setPort] = useState<string | null>(null);
    const hostIP = "192.168.67.185"; // Server IP

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        const storedRole = localStorage.getItem("userRole") as "teacher" | "student" | null;
        const storedPort = localStorage.getItem("userPort");
        const storedName = localStorage.getItem("userName");

        setEmail(storedEmail);
        setRole(storedRole);
        setPort(storedPort);
        setUserName(storedName || ""); // Default to empty string if null
    }, []);

    return (
        <UserContext.Provider value={{ email, role, port, hostIP, userName }}>
            {children}
        </UserContext.Provider>
    );
};
