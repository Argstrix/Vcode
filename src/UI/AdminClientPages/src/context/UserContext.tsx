import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
    email: string | null;
    role: "teacher" | "student" | null;
    port: string | null;
    hostIP: string;
}

const UserContext = createContext<UserContextType>({
    email: null,
    role: null,
    port: null,
    hostIP: "192.168.1.6",
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<"teacher" | "student" | null>(null);
    const [port, setPort] = useState<string | null>(null);
    const hostIP = "192.168.0.101"; // Server IP

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        const storedRole = localStorage.getItem("userRole") as
            | "teacher"
            | "student";
        const storedPort = localStorage.getItem("userPort");

        setEmail(storedEmail);
        setRole(storedRole);
        setPort(storedPort);
    }, []);

    return (
        <UserContext.Provider value={{ email, role, port, hostIP }}>
            {children}
        </UserContext.Provider>
    );
};
