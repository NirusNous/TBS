import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Button } from "@/components/ui/button";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="bg- shadow-md py-4 px-6 flex justify-between items-center">

            <Link to="/" className="text-xl font-bold text-gray-800">
                Booker.com
            </Link>
            
            <div className="space-x-4">
            <Link to="/events">Events</Link>{" "}
            {user && <Link to="/my-bookings">My Bookings</Link>}{" "}
            {user?.role === "admin" && (
                <Link to="/admin">Admin</Link>
            )}
            </div>
            <div className="space-x-4">
            {!user ? (
                <>
                    {" "}
                    <Link to="/login">Login</Link>{" "}
                    <Link to="/register">Register</Link>
                </>
            ) : (
                <>
                    {" "}
                    <span>Hi, {user.name}</span>{" "}
                    <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Logout
                    </Button>
                </>
            )}
            </div>
        </nav>
    );
};

export default Navbar;
