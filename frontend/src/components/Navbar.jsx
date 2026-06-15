import { Ticket } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Button } from "@/components/ui/button";

const Navbar = () => {
    const { user, isAdmin, logout, openLogin, openRegister } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/events", { replace: true });
        logout();
    };

    const navLinkClass = ({ isActive }) =>
        [
            "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
            isActive
                ? "bg-blue-950 text-amber-100"
                : "text-blue-950/75 hover:bg-blue-950/10 hover:text-blue-950",
        ].join(" ");

    return (
        <nav className="sticky top-0 z-50 border-b border-amber-500 bg-primary shadow-sm">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="group flex w-fit items-center gap-2 rounded-lg px-1 py-0.5 text-blue-950 transition hover:bg-blue-950/10"
                    aria-label="Booker.com home"
                >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-blue-950 text-amber-100 shadow-sm transition group-hover:bg-blue-900">
                        <Ticket className="size-5" />
                    </span>
                    <span className="flex flex-col leading-none">
                        <span className="text-lg font-black tracking-wide">Booker</span>
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-950/65">
                            .com
                        </span>
                    </span>
                </Link>

                <div className="flex flex-wrap items-center justify-center gap-1">
                    {isAdmin ? (
                        <>
                            <NavLink to="/admin" end className={navLinkClass}>
                                Admin
                            </NavLink>
                            <NavLink to="/admin/users" className={navLinkClass}>
                                Users
                            </NavLink>
                            <NavLink to="/admin/bookings" className={navLinkClass}>
                                Bookings
                            </NavLink>
                            <NavLink to="/events" className={navLinkClass}>
                                Events
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/events" className={navLinkClass}>
                                Events
                            </NavLink>
                            {user && (
                                <NavLink to="/my-bookings" className={navLinkClass}>
                                    My Bookings
                                </NavLink>
                            )}
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-start gap-2 text-sm sm:justify-end">
                    {!user ? (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-blue-950 hover:bg-blue-950/10"
                                onClick={() => openLogin()}
                            >
                                Sign In
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="bg-blue-950 text-amber-100 hover:bg-blue-900"
                                onClick={() => openRegister()}
                            >
                                Create Account
                            </Button>
                        </>
                    ) : (
                        <>
                            <span className="max-w-40 truncate text-blue-950/75">
                                Hi, {user.name}
                            </span>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                size="sm"
                                className="border-blue-950/25 bg-transparent text-blue-950 hover:bg-blue-950/10"
                            >
                                Logout
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
