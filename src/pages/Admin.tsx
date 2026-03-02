import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminWinners } from "@/components/AdminWinners";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Database } from "lucide-react";

const Admin = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const ALLOWED_ADMINS = ["goonlinemedia0@gmail.com", "emmanuel.salako@jumia.com"];

    useEffect(() => {
        // Only check Firebase Auth for admin access
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            const userEmail = user?.email?.toLowerCase().trim() || "";
            if (user && ALLOWED_ADMINS.includes(userEmail)) {
                setIsAdmin(true);
                setUser(user);
            } else {
                setIsAdmin(false);
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setIsAdmin(false);
        setUser(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-jumia border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground font-medium">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 pt-12">
                <AdminLogin onLoginSuccess={() => setIsAdmin(true)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar/Nav */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-jumia p-1.5 rounded-lg shadow-jumia/20 shadow-md">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                BRAND<span className="text-jumia">SNAP</span> ADMIN
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                                <span className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">
                                    {user?.email}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-destructive hover:bg-destructive/5"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center gap-2 text-slate-400 text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">Winners</span>
                </div>
                <AdminWinners />
            </main>

            <footer className="py-8 text-center text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} Brand Snap Game. Administrative Portal.
            </footer>
        </div>
    );
};

export default Admin;
