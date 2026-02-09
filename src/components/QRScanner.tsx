import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Zap, ZapOff } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
}

export const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
    const [error, setError] = useState<string | null>(null);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        let isMoving = false;
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;

        const startScanner = async () => {
            if (isMoving) return;
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                        },
                        (decodedText) => {
                            onScan(decodedText);
                        },
                        () => { }
                    );

                    // Check for torch/flashlight capability with retries
                    let attempts = 0;
                    const checkTorch = setInterval(() => {
                        try {
                            // @ts-ignore - Accessing underlying stream track
                            const track = html5QrCode.getRunningTrack();
                            if (track) {
                                const capabilities = track.getCapabilities() as any;
                                if (capabilities.torch) {
                                    setHasTorch(true);
                                    clearInterval(checkTorch);
                                }
                            }
                        } catch (e) {
                            console.warn("Torch check attempt failed:", e);
                        }

                        attempts++;
                        if (attempts > 10) clearInterval(checkTorch); // Stop after 5 seconds (10 * 500ms)
                    }, 500);
                } else {
                    setError("No cameras found. Please ensure your device has a camera.");
                }
            } catch (err: any) {
                console.error("Scanner Error:", err);
                if (!err.message?.includes("already scanning")) {
                    setError(`Permission Denied or Camera Busy. Please check your browser settings.`);
                }
            }
        };

        const onScan = (decodedText: string) => {
            // Prevent duplicate scans within 2 seconds
            const now = Date.now();
            // @ts-ignore
            if (html5QrCode._lastScan && now - html5QrCode._lastScan < 2000) return;
            // @ts-ignore
            html5QrCode._lastScan = now;

            onScanSuccess(decodedText);
        };

        const timeoutId = setTimeout(startScanner, 500);

        return () => {
            isMoving = true;
            clearTimeout(timeoutId);
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(e => console.error("Stop error", e));
            }
        };
    }, []);

    const toggleTorch = async () => {
        const scanner = html5QrCodeRef.current;
        if (scanner && scanner.isScanning) {
            try {
                const nextTorchState = !isTorchOn;
                await scanner.applyVideoConstraints({
                    // @ts-ignore
                    advanced: [{ torch: nextTorchState }]
                });
                setIsTorchOn(nextTorchState);
            } catch (e) {
                console.error("Torch toggle failed:", e);
            }
        }
    };

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="w-full max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-primary/20 bg-background shadow-2xl relative">
            <div id="reader" className="w-full aspect-square bg-black flex items-center justify-center relative">
                {error && (
                    <div className="p-6 text-center z-10">
                        <p className="text-destructive font-bold mb-2">Camera Error</p>
                        <p className="text-sm text-muted-foreground mb-6">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/20"
                        >
                            Retry Camera
                        </button>
                    </div>
                )}
                {!error && !html5QrCodeRef.current?.isScanning && (
                    <div className="text-center p-6 z-10">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="font-medium text-white">Initializing camera...</p>
                    </div>
                )}

                {/* Torch Control Button */}
                {hasTorch && (
                    <button
                        onClick={toggleTorch}
                        className={`absolute bottom-4 right-4 z-20 p-4 rounded-full transition-all ${isTorchOn ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-black/50 text-white backdrop-blur-md'
                            }`}
                        title={isTorchOn ? "Turn Flashlight Off" : "Turn Flashlight On"}
                    >
                        {isTorchOn ? <ZapOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                    </button>
                )}
            </div>

            <div className="p-6 text-center bg-background border-t border-border">
                <p className="text-sm font-bold text-primary mb-1 tracking-widest uppercase">Scanner Active</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Once a registration number is detected, <br />
                    the student's attendance will be marked instantly.
                </p>
            </div>
        </div>
    );
};
