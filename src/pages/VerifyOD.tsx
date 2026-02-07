import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Search, CheckCircle2, XCircle, ShieldCheck, User, Hash, BookOpen, GraduationCap, Calendar, MapPin } from "lucide-react";

interface CertificateData {
    certificateId: string;
    name: string;
    regNo: string;
    department: string;
    batch: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    status: string;
    issuedAt: any;
}

export default function VerifyOD() {
    const [searchParams] = useSearchParams();
    const [certificateId, setCertificateId] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CertificateData | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            setCertificateId(id);
            performVerification(id);
        }
    }, [searchParams]);

    const performVerification = async (id: string) => {
        if (!id.trim()) return;

        setLoading(true);
        setNotFound(false);
        setResult(null);
        setSearched(true);

        try {
            // Normalize the certificate ID
            const normalizedId = id.trim().toUpperCase();

            const docRef = doc(db, "certificates", normalizedId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setResult(docSnap.data() as CertificateData);
            } else {
                setNotFound(true);
            }
        } catch (error) {
            console.error("Error verifying certificate:", error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performVerification(certificateId);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-secondary/10">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Verify OD Certificate</h1>
                    <p className="text-muted-foreground mt-2">
                        Enter a certificate ID to verify its authenticity
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleVerifySubmit} className="mb-8">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={certificateId}
                                onChange={(e) => setCertificateId(e.target.value)}
                                placeholder="Enter Certificate ID (e.g., RIT-OD-000001)"
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !certificateId.trim()}
                            className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Verify"
                            )}
                        </button>
                    </div>
                </form>

                {/* Result */}
                {searched && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {result ? (
                            <div className="bg-background rounded-3xl border border-green-500/30 p-8 shadow-lg">
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-green-600">Certificate Verified</h2>
                                        <p className="text-sm text-muted-foreground">This is a valid OD certificate</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Certificate ID */}
                                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Certificate ID</p>
                                            <p className="font-bold text-primary">{result.certificateId}</p>
                                        </div>
                                    </div>

                                    {/* Student Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-xl">
                                            <User className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Student Name</p>
                                                <p className="font-medium">{result.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-xl">
                                            <Hash className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Register Number</p>
                                                <p className="font-medium">{result.regNo}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-xl">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Department</p>
                                                <p className="font-medium">{result.department}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-xl">
                                            <GraduationCap className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Batch</p>
                                                <p className="font-medium">{result.batch}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Event Info */}
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h3 className="text-sm font-bold text-muted-foreground mb-4">EVENT DETAILS</h3>
                                        <div className="bg-secondary/10 rounded-xl p-4 space-y-3">
                                            <h4 className="font-bold text-lg">{result.eventTitle}</h4>
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="w-4 h-4" />
                                                    {result.eventDate}
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin className="w-4 h-4" />
                                                    {result.eventVenue}
                                                </div>
                                            </div>
                                            <span className="inline-block px-3 py-1 bg-green-500/10 text-green-600 text-xs font-bold uppercase tracking-wider rounded-full">
                                                {result.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : notFound ? (
                            <div className="bg-background rounded-3xl border border-destructive/30 p-8 shadow-lg text-center">
                                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-8 h-8 text-destructive" />
                                </div>
                                <h2 className="text-xl font-bold text-destructive mb-2">Certificate Not Found</h2>
                                <p className="text-muted-foreground">
                                    The certificate ID <span className="font-mono font-bold">{certificateId.toUpperCase()}</span> does not exist in our records.
                                    <br />
                                    Please check the ID and try again.
                                </p>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Info */}
                {!searched && (
                    <div className="text-center text-muted-foreground">
                        <p className="text-sm">
                            Certificate IDs are in the format: <span className="font-mono font-bold">RIT-OD-XXXXXX</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
