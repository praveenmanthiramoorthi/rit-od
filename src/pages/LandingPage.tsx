import { ShieldCheck, Calendar, QrCode, ClipboardCheck, Download, CheckCircle2, X, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { generateODCertificate } from "@/lib/pdf";
import { logODToSheet, generateCertificateId } from "@/lib/sheets";

import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, getDoc, setDoc, runTransaction } from "firebase/firestore";

export default function LandingPage() {
    const { user, userData, login } = useAuth();
    const [attendance, setAttendance] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchAttendance();
        }
    }, [user]);

    const fetchAttendance = async () => {
        if (!user || !user.email) return;

        // Use stored regNo if available, otherwise fallback to email extraction
        const regNo = userData?.regNo || user.email.split('@')[0].toUpperCase();

        try {
            const q = query(collection(db, `students/${regNo}/attendance`));
            const querySnapshot = await getDocs(q);
            const records = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (records.length > 0) {
                setAttendance(records.sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds));
            } else {
                setAttendance([]);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const handleDownloadCertificate = async (record: any) => {
        if (!user || !userData) return;

        setIsDownloading(true);

        try {
            // Get next certificate number using Firestore transaction
            const counterRef = doc(db, "counters", "certificateCounter");

            let newCounter = 1;
            try {
                await runTransaction(db, async (transaction) => {
                    const counterDoc = await transaction.get(counterRef);
                    if (counterDoc.exists()) {
                        newCounter = (counterDoc.data().value || 0) + 1;
                    }
                    transaction.set(counterRef, { value: newCounter });
                });
            } catch (err) {
                // If transaction fails, try to get current value and increment
                const counterDoc = await getDoc(counterRef);
                newCounter = counterDoc.exists() ? (counterDoc.data().value || 0) + 1 : 1;
                await setDoc(counterRef, { value: newCounter });
            }

            const certificateId = generateCertificateId(newCounter);

            // Store certificate data in Firestore for verification
            const certificateData = {
                certificateId,
                name: userData.name || user.displayName || "Student",
                regNo: userData.regNo || user.email?.split('@')[0].toUpperCase() || "",
                department: userData.department || "N/A",
                batch: userData.batch || "N/A",
                eventTitle: record.eventTitle,
                eventDate: record.eventDate,
                eventVenue: record.eventVenue,
                status: record.status,
                issuedAt: new Date()
            };

            await setDoc(doc(db, "certificates", certificateId), certificateData);

            // Log to Google Sheets
            await logODToSheet({
                timestamp: new Date().toLocaleString(),
                name: userData.name || user.displayName || "Student",
                regNo: userData.regNo || "",
                eventName: record.eventTitle,
                club: record.clubName || "N/A",
                certificateId: certificateId
            });

            // Generate and download PDF
            await generateODCertificate(
                {
                    name: userData.name || user.displayName || "Student",
                    regNo: userData.regNo || user.email?.split('@')[0].toUpperCase() || "",
                    department: userData.department || "N/A",
                    batch: userData.batch || "N/A"
                },
                {
                    eventTitle: record.eventTitle,
                    eventDate: record.eventDate,
                    eventVenue: record.eventVenue,
                    status: record.status
                },
                certificateId
            );
        } catch (error) {
            console.error("Error generating certificate:", error);
            alert("Failed to generate certificate. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const features = [
        {
            icon: Calendar,
            title: "Phase 1: Provisional OD",
            description: "Apply for OD while registering for events. Get instant provisional approval."
        },
        {
            icon: QrCode,
            title: "Phase 2: QR Scanning",
            description: "On event day, scan your venue-specific QR code to mark your attendance."
        },
        {
            icon: ClipboardCheck,
            title: "Confirmed Verification",
            description: "Attendance is automatically converted to confirmed OD after successful scan."
        }
    ];

    return (
        <div className="min-h-screen pt-16">
            {/* Student Attendance Display (Top) */}
            {user && (
                <section className="bg-primary/5 border-b border-primary/10 py-12 px-4 shadow-inner">
                    <div className="max-w-7xl mx-auto">
                        <div className="space-y-1 mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                Welcome back, {userData?.name || user.displayName?.split(' ')[0]}
                                <span className="text-primary"><CheckCircle2 className="w-6 h-6" /></span>
                            </h2>
                            {userData && (
                                <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">{userData.regNo}</span>
                                    <span>•</span>
                                    <span>{userData.department}</span>
                                    <span>•</span>
                                    <span>Batch {userData.batch}</span>
                                </div>
                            )}
                            <p className="text-muted-foreground mt-2">Click on an event to view details and download your OD certificate.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {attendance.length > 0 ? (
                                attendance.map((record, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedEvent(record)}
                                        className="bg-background p-5 rounded-2xl border border-primary/10 shadow-sm hover:border-primary/50 hover:shadow-lg transition-all text-left group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-2 py-1 bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                {record.status}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{record.eventDate}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{record.eventTitle}</h4>
                                        <p className="text-xs text-muted-foreground italic">{record.eventVenue}</p>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-background/50 rounded-2xl border border-dashed border-border text-muted-foreground">
                                    No attendance records found yet.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="px-3 py-1 bg-green-500/10 text-green-600 text-xs font-bold uppercase tracking-wider rounded-full">
                                    {selectedEvent.status}
                                </span>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold mb-6">{selectedEvent.eventTitle}</h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-xl">
                                <Calendar className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Date</p>
                                    <p className="font-medium">{selectedEvent.eventDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-xl">
                                <MapPin className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Venue</p>
                                    <p className="font-medium">{selectedEvent.eventVenue}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDownloadCertificate(selectedEvent)}
                            disabled={isDownloading}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Download OD Certificate
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Hero Section - Only show when not logged in */}
            {!user && (
                <>
                    <section className="relative py-20 px-4 overflow-hidden">
                        <div className="absolute top-0 right-0 -z-10 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-1/3 bg-primary/10 blur-[100px] rounded-full" />

                        <div className="max-w-7xl mx-auto text-center">
                            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-bounce">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Trusted by College Administrations</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                                Eliminate OD Misuse with <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                                    Verification Dashboard
                                </span>
                            </h1>

                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                                The ultimate event-based OD management system for colleges.
                                Two-stage verification with secure QR-based venue attendance tracking.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={login}
                                    className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
                                >
                                    Get Started
                                </button>
                                <button className="w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold border border-border hover:bg-secondary/80 transition-all">
                                    Learn more
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="py-24 bg-secondary/30">
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {features.map((feature, index) => (
                                    <div key={index} className="p-8 bg-background border border-border rounded-3xl hover:shadow-xl transition-all group">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                            <feature.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
