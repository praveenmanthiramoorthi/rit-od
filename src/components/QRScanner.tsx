import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
}

export const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
    const [error, setError] = useState<string | null>(null);
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
                    // Start with the back camera (if available) or the first one
                    // const camera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];

                    await html5QrCode.start(
                        { facingMode: "environment" }, // Try back camera directly
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                        },
                        (decodedText) => {
                            // On success
                            onScanSuccess(decodedText);
                        },
                        () => { } // Ignore scan failures
                    );
                } else {
                    setError("No cameras found. Please ensure your device has a camera.");
                }
            } catch (err: any) {
                console.error("Scanner Error:", err);
                if (!err.message?.includes("already scanning")) { // Check err.message for "already scanning"
                    setError(`Permission Denied or Camera Busy. Please check your browser settings.`);
                }
            }
        };

        const timeoutId = setTimeout(startScanner, 500); // Small delay to avoid StrictMode double-fire issues

        return () => {
            isMoving = true;
            clearTimeout(timeoutId);
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(e => console.error("Stop error", e));
            }
        };
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="w-full max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-primary/20 bg-background shadow-2xl">
            <div id="reader" className="w-full aspect-square bg-black flex items-center justify-center">
                {error && (
                    <div className="p-6 text-center">
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
                    <div className="text-center p-6">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="font-medium">Initializing camera...</p>
                        <p className="text-xs text-muted-foreground mt-2">Waiting for permissions...</p>
                    </div>
                )}
            </div>
            <div className="p-6 text-center bg-background border-t border-border">
                <p className="text-sm font-bold text-primary mb-1">QR SCANNER READY</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Make sure your camera lens is clean and <br />
                    the QR code is well-lit.
                </p>
            </div>
        </div>
    );
};
