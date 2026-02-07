const SHEETS_WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL;

interface ODLogData {
    timestamp: string;
    name: string;
    regNo: string;
    eventName: string;
    club: string;
    certificateId: string;
}

export const logODToSheet = async (data: ODLogData): Promise<boolean> => {
    try {
        await fetch(SHEETS_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors", // Google Apps Script requires this
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        // With no-cors, we can't read the response, but the request should go through
        console.log("OD logged to sheet:", data);
        return true;
    } catch (error) {
        console.error("Failed to log OD to sheet:", error);
        return false;
    }
};

export const generateCertificateId = (counter: number): string => {
    // Format: RIT-OD-000001
    const paddedNumber = counter.toString().padStart(6, '0');
    return `RIT-OD-${paddedNumber}`;
};
