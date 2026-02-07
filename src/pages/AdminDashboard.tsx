import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, Timestamp, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Plus, Users, QrCode, ClipboardList, Download, X, Calendar, MapPin, CheckCircle2, Trash2 } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { generateEventReportPDF } from "@/lib/pdf";

interface Event {
    id: string;
    title: string;
    date: string;
    venue: string;
    clubEmail: string;
    createdAt: any;
}

interface Attendance {
    studentEmail: string;
    regNo: string;
    timestamp: any;
    status: string;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newVenue, setNewVenue] = useState("");

    const clubName = user?.email === "techspark@ritchennai.edu.in" ? "Techspark" : user?.displayName?.split(' ')[0] || "Admin";

    useEffect(() => {
        if (!user) return;

        // Fetch events created by this club
        const q = query(collection(db, "events"), where("clubEmail", "==", user.email));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const evs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
            setEvents(evs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!selectedEvent) return;

        // Listen to attendance for selected event
        const q = collection(db, `events/${selectedEvent.id}/attendance`);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const att = snapshot.docs.map(doc => doc.data() as Attendance);
            setAttendanceList(att.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
        });

        return () => unsubscribe();
    }, [selectedEvent]);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            await addDoc(collection(db, "events"), {
                title: newTitle,
                date: newDate,
                venue: newVenue,
                clubEmail: user.email,
                createdAt: Timestamp.now()
            });
            setShowCreateModal(false);
            setNewTitle("");
            setNewDate("");
            setNewVenue("");
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event");
        }
    };

    const handleScanSuccess = async (regNo: string) => {
        if (!selectedEvent || !regNo) return;

        const cleanRegNo = regNo.trim().toUpperCase();

        try {
            // 1. Mark in Event Subcollection (for Admin view)
            const eventAttendanceRef = doc(db, `events/${selectedEvent.id}/attendance`, cleanRegNo);
            const attendanceData = {
                regNo: cleanRegNo,
                studentEmail: `${cleanRegNo.toLowerCase()}@ritchennai.edu.in`,
                timestamp: Timestamp.now(),
                status: "Confirmed",
                eventTitle: selectedEvent.title,
                eventDate: selectedEvent.date,
                eventVenue: selectedEvent.venue
            };

            await setDoc(eventAttendanceRef, attendanceData);

            // 2. Mark in Student Collection (for Student Dashboard view)
            const studentAttendanceRef = doc(db, `students/${cleanRegNo}/attendance`, selectedEvent.id);
            await setDoc(studentAttendanceRef, attendanceData);

            await setDoc(studentAttendanceRef, attendanceData);

            // Instead of closing, show a temporary success toast/alert
            const msg = `Success: ${cleanRegNo} Marked!`;
            console.log(msg);
            // We use alert for now but it stays open
            alert(msg);
            // The scanner remains open for the next person
        } catch (error) {
            console.error("Error marking attendance:", error);
            alert("Error marking attendance. Please try again.");
        }
    };

    const handleDownloadReport = () => {
        if (!selectedEvent) return;
        generateEventReportPDF(clubName, selectedEvent, attendanceList);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "events", eventId));
            if (selectedEvent?.id === eventId) {
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event.");
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-secondary/10">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Welcome, {clubName}</h1>
                        <p className="text-muted-foreground">Manage your events and track attendee ODs.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Event
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Events List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Your Events
                        </h2>
                        {events.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-background/50">
                                <p className="text-muted-foreground">No events created yet.</p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div
                                    key={event.id}
                                    className={`relative w-full text-left p-6 rounded-2xl border transition-all ${selectedEvent?.id === event.id
                                        ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                                        : "bg-background border-border hover:border-primary/50"
                                        }`}
                                >
                                    <button
                                        onClick={() => setSelectedEvent(event)}
                                        className="w-full text-left"
                                    >
                                        <h3 className="font-bold text-lg mb-2 pr-8">{event.title}</h3>
                                        <div className="flex flex-col gap-1 text-sm opacity-80">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {event.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {event.venue}
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteEvent(event.id);
                                        }}
                                        className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${selectedEvent?.id === event.id
                                            ? "hover:bg-white/20 text-white/80 hover:text-white"
                                            : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                            }`}
                                        title="Delete Event"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Event Detail / Dashboard */}
                    <div className="lg:col-span-2">
                        {selectedEvent ? (
                            <div className="bg-background rounded-3xl border border-border p-8 shadow-sm h-full">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                                        <p className="text-muted-foreground">{attendanceList.length} Attendee(s)</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setShowScanner(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            Mark Attendance
                                        </button>
                                        <button
                                            onClick={handleDownloadReport}
                                            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Report
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        Recent Attendance
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {attendanceList.length === 0 ? (
                                            <p className="text-muted-foreground col-span-full py-8 text-center bg-secondary/5 rounded-2xl border border-dashed border-border">
                                                No attendance marked yet. Start scanning!
                                            </p>
                                        ) : (
                                            attendanceList.map((att, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-border">
                                                    <div>
                                                        <p className="font-bold text-sm">{att.regNo}</p>
                                                        <p className="text-xs text-muted-foreground">{att.timestamp?.toDate().toLocaleTimeString()}</p>
                                                    </div>
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center bg-background rounded-3xl border border-dashed border-border p-12">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                                    <ClipboardList className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Select an event</h3>
                                <p className="text-muted-foreground max-w-xs">
                                    Select an event from the left list or create a new one to start tracking attendance.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-background w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">New Event</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">Event Title</label>
                                <input
                                    required
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="e.g. Annual Tech Symposium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1">Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1">Venue</label>
                                    <input
                                        required
                                        type="text"
                                        value={newVenue}
                                        onChange={(e) => setNewVenue(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Main Hall"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold mt-6 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]"
                            >
                                Create Event
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-background w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Scan Attendance</h2>
                                <p className="text-sm text-muted-foreground">{selectedEvent?.title}</p>
                            </div>
                            <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8">
                            <QRScanner onScanSuccess={handleScanSuccess} />
                        </div>
                        <div className="px-8 pb-8 flex justify-center">
                            <button
                                onClick={() => setShowScanner(false)}
                                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
