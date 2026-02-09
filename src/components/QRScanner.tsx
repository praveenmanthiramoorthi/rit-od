import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Zap, ZapOff, CameraOff, RefreshCw } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
}

export const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);

    // Create a unique ID for the reader to prevent collisions
    const readerId = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`).current;
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const onScanSuccessRef = useRef(onScanSuccess);

    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    useEffect(() => {
        let isUnmounted = false;
        let scanner: Html5Qrcode | null = null;

        const initScanner = async () => {
            // Wait for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
            if (isUnmounted) return;

            try {
                const element = document.getElementById(readerId);
                if (!element) {
                    console.error("Reader element not found");
                    return;
                }

                scanner = new Html5Qrcode(readerId);
                html5QrCodeRef.current = scanner;

                const startConfig = {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                };

                await scanner.start(
                    { facingMode: "environment" },
                    startConfig,
                    (decodedText) => {
                        const now = Date.now();
                        // @ts-ignore
                        if (scanner._lastScan && now - scanner._lastScan < 2000) return;
                        // @ts-ignore
                        scanner._lastScan = now;

                        if ('vibrate' in navigator) navigator.vibrate(100);
                        onScanSuccessRef.current(decodedText);
                    },
                    () => { /* scan error - ignore */ }
                );

                if (!isUnmounted) {
                    setIsScanning(true);

                    const trackCheckInterval = setInterval(() => {
                        if (isUnmounted) return clearInterval(trackCheckInterval);

                        try {
                            // @ts-ignore
                            const track = scanner.getRunningTrack();
                            if (track) {
                                const caps = track.getCapabilities() as any;
                                if (caps?.torch) {
                                    setHasTorch(true);
                                    clearInterval(trackCheckInterval);
                                }
                            }
                        } catch (e) { }
                    }, 800);

                    setTimeout(() => clearInterval(trackCheckInterval), 8000);
                }
            } catch (err: any) {
                console.error("Scanner Error:", err);
                if (!isUnmounted) {
                    if (err.toString().includes("Permission denied")) {
                        setError("Camera permission denied.");
                    } else {
                        setError("Could not access camera.");
                    }
                }
            }
        };

        initScanner();

        return () => {
            isUnmounted = true;
            if (scanner && scanner.isScanning) {
                scanner.stop().catch(e => console.error("Scanner stop fail", e));
            }
        };
    }, [readerId]);

    const toggleTorch = async () => {
        const scanner = html5QrCodeRef.current;
        if (scanner?.isScanning) {
            try {
                const newState = !isTorchOn;
                await scanner.applyVideoConstraints({
                    // @ts-ignore
                    advanced: [{ torch: newState }]
                });
                setIsTorchOn(newState);
            } catch (e) {
                console.error("Torch fail", e);
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative group">
            <div className="w-full aspect-square bg-slate-950 rounded-2xl border-2 border-primary/20 shadow-2xl overflow-hidden relative">
                <div id={readerId} className="w-full h-full" />

                {!isScanning && !error && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-white font-bold tracking-widest text-xs uppercase">Initializing...</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-slate-900/95 text-center">
                        <CameraOff className="w-12 h-12 text-destructive mb-4" />
                        <p className="text-white font-bold mb-2">Scanner Error</p>
                        <p className="text-xs text-slate-400 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {hasTorch && isScanning && (
                    <button
                        onClick={toggleTorch}
                        className={`absolute top-6 right-6 z-30 p-4 rounded-2xl transition-all duration-300 ${isTorchOn
                                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 rotate-12'
                                : 'bg-black/40 text-white backdrop-blur-md hover:bg-black/60'
                            }`}
                    >
                        {isTorchOn ? <ZapOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                    </button>
                )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
                    {isScanning ? 'Lens Active' : 'Lens Inactive'}
                </span>
            </div>
        </div>
    );
};
