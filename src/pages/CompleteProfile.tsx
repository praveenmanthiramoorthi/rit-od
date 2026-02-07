import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { UserCircle, UserPlus, Phone, BookOpen, Hash, GraduationCap } from "lucide-react";

export default function CompleteProfile() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.displayName || "",
        regNo: "",
        department: "",
        batch: "",
        mobile: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            await setDoc(doc(db, "users", user.uid), {
                ...formData,
                email: user.email,
                createdAt: new Date()
            });
            // Profile is now complete, AuthContext will catch this and redirect
            window.location.reload(); // Force reload to refresh AuthContext state
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-12 px-4 bg-secondary/10 flex items-center justify-center">
            <div className="max-w-md w-full bg-background rounded-3xl p-8 shadow-2xl border border-border">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Complete Your Profile</h1>
                    <p className="text-muted-foreground mt-2">Please provide your student details to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1 flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-primary" />
                            Full Name
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Your Full Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-primary" />
                            Register Number
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.regNo}
                            onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="e.g. 211521104001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            Department
                        </label>
                        <select
                            required
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="">Select Department</option>
                            <option value="CSE(AIML)">CSE(AIML)</option>
                            <option value="CSE">CSE</option>
                            <option value="CCE">CCE</option>
                            <option value="ECE">ECE</option>
                            <option value="EE(VLSI)">EE(VLSI)</option>
                            <option value="AI&DS">AI&DS</option>
                            <option value="CSBS">CSBS</option>
                            <option value="MECH">MECH</option>
                            <option value="BIOTECH">BIOTECH</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 ml-1 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-primary" />
                                Batch
                            </label>
                            <select
                                required
                                value={formData.batch}
                                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="">Select Batch</option>
                                <option value="22-26">22-26</option>
                                <option value="23-27">23-27</option>
                                <option value="24-28">24-28</option>
                                <option value="25-29">25-29</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 ml-1 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-primary" />
                                Mobile
                            </label>
                            <input
                                required
                                type="tel"
                                pattern="[0-9]{10}"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="10-digit number"
                            />
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? "Saving..." : "Save Profile"}
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
