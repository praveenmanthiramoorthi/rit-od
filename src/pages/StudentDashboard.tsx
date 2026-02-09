import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, setDoc, doc, getDoc } from "firebase/firestore";
import {
    Calendar,
    MapPin,
    Download,
    User,
    GraduationCap,
    BookOpen,
    Hash,
    CheckCircle2,
    ClipboardList,
    Clock,
    ShieldCheck
} from "lucide-react";
import { generateODCertificate } from "@/lib/pdf";

interface AttendanceRecord {
    id: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    timestamp: any;
    status: string;
}

export default function StudentDashboard() {
    const { userData } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData?.regNo) return;

        const q = query(
            collection(db, `students/${userData.regNo}/attendance`),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AttendanceRecord));
            setAttendance(records);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData]);

    const handleDownloadCertificate = async (record: AttendanceRecord) => {
        if (!userData) return;

        // Generate a unique certificate ID if it doesn't exist
        // In a real app, this should be pre-generated when attendance is marked
        // For this demo, we'll use a consistent ID format: RIT-OD-REGISTERNO-EVENTID
        const certificateId = `RIT-OD-${userData.regNo}-${record.id}`.toUpperCase().slice(0, 15);

        // Before downloading, we should ideally ensure this certificate is in the 'certificates' collection 
        // to make it verifiable via QR code
        try {
            const certRef = doc(db, "certificates", certificateId);
            const certSnap = await getDoc(certRef);

            if (!certSnap.exists()) {
                await setDoc(certRef, {
                    certificateId,
                    name: userData.name,
                    regNo: userData.regNo,
                    department: userData.department,
                    batch: userData.batch,
                    eventTitle: record.eventTitle,
                    eventDate: record.eventDate,
                    eventVenue: record.eventVenue,
                    status: "Confirmed",
                    issuedAt: new Date()
                });
            }
        } catch (error) {
            console.error("Error ensuring certificate record:", error);
        }

        generateODCertificate(
            {
                name: userData.name,
                regNo: userData.regNo,
                department: userData.department,
                batch: userData.batch
            },
            {
                eventTitle: record.eventTitle,
                eventDate: record.eventDate,
                eventVenue: record.eventVenue,
                status: record.status || "Confirmed"
            },
            certificateId
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-secondary/10">
            <div className="max-w-5xl mx-auto">
                {/* Profile Header */}
                <div className="bg-background rounded-3xl p-8 border border-border mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center text-primary relative">
                            <User className="w-12 h-12" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-2xl font-bold">{userData?.name}</h1>
                            <p className="text-muted-foreground">{userData?.email}</p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                <div className="flex items-center gap-1.5 text-xs bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
                                    <Hash className="w-3.5 h-3.5 text-primary" />
                                    <span className="font-medium">{userData?.regNo}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
                                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                                    <span className="font-medium">{userData?.department}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
                                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                    <span className="font-medium">{userData?.batch} Batch</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-primary text-white rounded-3xl p-6 shadow-xl shadow-primary/20">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">Activity</span>
                            </div>
                            <h3 className="text-4xl font-bold mb-1">{attendance.length}</h3>
                            <p className="text-white/80 text-sm">Total Events Attended</p>
                        </div>

                        <div className="bg-background rounded-3xl p-6 border border-border shadow-sm">
                            <h3 className="font-bold flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                System Verification
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                All certificates generated here include a unique QR code for verification by staff members.
                            </p>
                            <div className="mt-4 p-4 bg-secondary/10 rounded-xl border border-border">
                                <p className="text-xs font-medium text-center text-primary italic">"Ensuring authenticity in every scan."</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Attendance List */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Your Attendance History</h2>
                            {attendance.length > 0 && (
                                <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
                                    {attendance.length} Records Found
                                </span>
                            )}
                        </div>

                        {attendance.length === 0 ? (
                            <div className="bg-background rounded-3xl border-2 border-dashed border-border p-12 text-center h-[400px] flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-6 text-muted-foreground/50">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">No Attendance Yet</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    Once you scan an event's QR code, your attendance and OD certificate will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {attendance.map((record) => (
                                    <div key={record.id} className="bg-background rounded-2xl border border-border p-5 hover:border-primary/40 transition-all hover:shadow-lg group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{record.eventTitle}</h4>
                                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                                                        Confirmed
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-primary" />
                                                        {record.eventDate}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        {record.eventVenue}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadCertificate(record)}
                                                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
                                            >
                                                <Download className="w-4 h-4" />
                                                Get Certificate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
