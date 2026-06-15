import { useCallback, useRef, useState } from "react";
import AuthContext from "./authContext";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [authMode, setAuthMode] = useState(null);
    const [authMessage, setAuthMessage] = useState("");
    const [authVersion, setAuthVersion] = useState(0);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const authSuccessRef = useRef(null);
    const logoutTimerRef = useRef(null);

    const login = useCallback((userData, token) => {
        if (logoutTimerRef.current) {
            window.clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }
        setIsLoggingOut(false);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        setIsLoggingOut(true);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthMode(null);
        setAuthMessage("");
        authSuccessRef.current = null;
        setUser(null);
        if (logoutTimerRef.current) {
            window.clearTimeout(logoutTimerRef.current);
        }
        logoutTimerRef.current = window.setTimeout(() => {
            setIsLoggingOut(false);
            logoutTimerRef.current = null;
        }, 1000);
    }, []);

    const openAuthModal = useCallback((mode = "login", options = {}) => {
        setAuthMode(mode);
        setAuthMessage(options.message || "");
        setAuthVersion(version => version + 1);
        authSuccessRef.current = options.onSuccess || null;
    }, []);

    const openLogin = useCallback((options = {}) => {
        openAuthModal("login", options);
    }, [openAuthModal]);

    const openRegister = useCallback((options = {}) => {
        openAuthModal("register", options);
    }, [openAuthModal]);

    const switchAuthMode = useCallback((mode) => {
        setAuthMode(mode);
        setAuthVersion(version => version + 1);
    }, []);

    const closeAuthModal = useCallback(() => {
        setAuthMode(null);
        setAuthMessage("");
        authSuccessRef.current = null;
    }, []);

    const completeAuth = useCallback((userData, token) => {
        login(userData, token);

        const onSuccess = authSuccessRef.current;
        setAuthMode(null);
        setAuthMessage("");
        authSuccessRef.current = null;

        return onSuccess;
    }, [login]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAdmin: user?.role === "admin",
                authMode,
                authMessage,
                authVersion,
                isLoggingOut,
                login,
                logout,
                openLogin,
                openRegister,
                switchAuthMode,
                closeAuthModal,
                completeAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
