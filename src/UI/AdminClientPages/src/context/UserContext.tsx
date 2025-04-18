import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
    email: string | null;
    role: "admin" | "student" | null;
    port: string | null;
}

const UserContext = createContext<UserContextType>({
    email: null,
    role: null,
    port: null,
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<"admin" | "student" | null>(null);
    const [port, setPort] = useState<string | null>(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        const storedRole = localStorage.getItem("userRole") as "admin" | "student";
        const storedPort = localStorage.getItem("backendPort");

        setEmail(storedEmail);
        setRole(storedRole);
        setPort(storedPort);
    }, []);

    return (
        <UserContext.Provider value={{ email, role, port }}>
            {children}
        </UserContext.Provider>
    );
};
