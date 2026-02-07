import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserData {
    name: string;
    regNo: string;
    department: string;
    batch: string;
    mobile: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    error: string | null;
    isAdmin: boolean;
    profileComplete: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileComplete, setProfileComplete] = useState<boolean>(false);

    const adminEmails = ["praveenmanthiramoorthi@gmail.com", "techspark@ritchennai.edu.in"];
    const isAdmin = !!user && adminEmails.includes(user.email || "");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            const isAllowed = currentUser && (
                currentUser.email?.endsWith("ritchennai.edu.in") ||
                adminEmails.includes(currentUser.email || "")
            );

            if (currentUser && !isAllowed) {
                signOut(auth);
                setUser(null);
                setUserData(null);
                setProfileComplete(false);
            } else if (currentUser) {
                setUser(currentUser);
                // Check if profile exists in Firestore
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data() as UserData);
                    setProfileComplete(true);
                } else {
                    setUserData(null);
                    setProfileComplete(false);
                }
            } else {
                setUser(null);
                setUserData(null);
                setProfileComplete(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const email = result.user.email || "";
            const isAllowed = email.endsWith("ritchennai.edu.in") || adminEmails.includes(email);

            if (!isAllowed) {
                await signOut(auth);
                const errorMsg = "Access Denied: Restricted to college or authorized club emails.";
                setError(errorMsg);
                alert(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error("Login failed", error);
            const msg = error.message || "Login failed";
            setError(msg);
            if (!msg.includes("closed by user")) {
                alert(msg);
            }
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setError(null);
            setUserData(null);
            setProfileComplete(false);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, error, isAdmin, profileComplete, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
