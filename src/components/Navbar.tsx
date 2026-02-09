import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogIn, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
    const { user, login, logout, isAdmin } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                OD Verify
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {!isAdmin && (
                            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                        )}
                        <Link to="/verify" className="text-sm font-medium hover:text-primary transition-colors">Verify OD</Link>
                        {user ? (
                            <>
                                {isAdmin && (
                                    <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                                        <ShieldCheck className="w-4 h-4" />
                                        Admin Console
                                    </Link>
                                )}
                                <button
                                    onClick={() => logout()}
                                    className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-all hover:scale-105"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => login()}
                                className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:scale-105"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Login with College Email</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-md text-foreground"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Content */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border bg-background p-4 space-y-4">
                    {!isAdmin && (
                        <Link to="/" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
                    )}
                    <Link to="/verify" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Verify OD</Link>
                    {user ? (
                        <button
                            onClick={() => { logout(); setIsMenuOpen(false); }}
                            className="w-full flex items-center space-x-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => { login(); setIsMenuOpen(false); }}
                            className="w-full flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Login with College Email</span>
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}
