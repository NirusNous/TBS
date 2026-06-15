import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ children }) => {
    const { user, isLoggingOut, openLogin } = useAuth();

    useEffect(() => {
        if (!user && !isLoggingOut) {
            openLogin({ message: "Sign in to continue." });
        }
    }, [isLoggingOut, openLogin, user]);

    if (!user) {
        return (
            <Navigate
                to="/events"
                replace
            />
        );
    }
    return children;
};

const AdminRoute =({ children }) => {
    const { user, isLoggingOut, openLogin } = useAuth();

    useEffect(() => {
        if (!user && !isLoggingOut) {
            openLogin({ message: "Sign in with an admin account to continue." });
        }
    }, [isLoggingOut, openLogin, user]);

    if (!user || user.role !== "admin" ) {
        return (<Navigate to="/events" replace />);
    }

    return children;
};

export { ProtectedRoute, AdminRoute };
