import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

interface AttendanceRecord {
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    status: string;
    regNo?: string;
}

interface StudentData {
    name: string;
    regNo: string;
    department: string;
    batch: string;
}

export const generateEventReportPDF = (clubName: string, event: { title: string, date: string, venue: string }, attendance: any[]) => {
    try {
        console.log("PDF DEBUG: Starting generation", { clubName, event, count: attendance?.length });
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Header & Branding
        console.log("PDF DEBUG: Drawing Header");
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229);
        doc.setFont("helvetica", "bold");
        doc.text("Event Attendance Report", pageWidth / 2, 20, { align: "center" });

        // 2. Info Box
        console.log("PDF DEBUG: Drawing Info Box");
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(15, 30, pageWidth - 30, 40, 3, 3, 'FD');

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("ORGANIZED BY", 25, 40);
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text((clubName || "Admin").toUpperCase(), 25, 48);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("EVENT TITLE", 25, 60);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(event?.title || "N/A", 25, 66);

        doc.text("DATE", pageWidth - 100, 40);
        doc.text(event?.date || "N/A", pageWidth - 100, 48);
        doc.text("VENUE", pageWidth - 100, 60);
        doc.text(event?.venue || "N/A", pageWidth - 100, 66);

        // 3. Summary
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Attendees: ${attendance?.length || 0}`, 15, 85);
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, pageWidth - 15, 85, { align: "right" });

        // 4. Data Preparation
        console.log("PDF DEBUG: Preparing Table Data");
        const tableColumn = ["S.No", "Register Number", "Scan Date", "Scan Time", "Status"];
        const tableRows = (attendance || []).map((record, index) => {
            let timeStr = "N/A";
            let dateStr = "N/A";
            try {
                if (record && record.timestamp) {
                    let dateObj: Date;
                    const ts = record.timestamp;
                    if (ts && typeof ts.toDate === 'function') dateObj = ts.toDate();
                    else if (ts && typeof ts.seconds === 'number') dateObj = new Date(ts.seconds * 1000);
                    else dateObj = new Date(ts);

                    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                        timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
                    }
                }
            } catch (e) { console.warn("Row error", index, e); }

            return [index + 1, record?.regNo || "N/A", dateStr, timeStr, record?.status || "Confirmed"];
        });

        // 5. Table Generation
        console.log("PDF DEBUG: Attempting autoTable");
        try {
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 90,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [79, 70, 229] },
            });
        } catch (tableErr) {
            console.error("PDF DEBUG: tableErr", tableErr);
            throw tableErr;
        }

        // 6. Footer
        console.log("PDF DEBUG: Adding Footer");
        const finalY = (doc as any).lastAutoTable?.finalY || 95;
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("This is an official attendance report generated from the RIT OD Hub.", pageWidth / 2, finalY + 15, { align: "center" });

        // 7. Save
        console.log("PDF DEBUG: Saving File");
        const safeTitle = (event?.title || "Event").toString().replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`Attendance_${safeTitle}.pdf`);
        console.log("PDF DEBUG: Success");
    } catch (error) {
        console.error("CRITICAL PDF ERROR:", error);
        alert(`Report error: ${error instanceof Error ? error.message : "Internal Error"}`);
    }
};

export const generateODCertificate = async (student: StudentData, record: AttendanceRecord, certificateId: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Load Local Logo
    const logoUrl = "/images/rit logo.jpeg";

    // Border
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner decorative border
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // --- Background Designs (Technical/Professional) ---
    // Light grid pattern
    doc.setDrawColor(240);
    doc.setLineWidth(0.1);
    for (let i = 20; i < pageWidth - 20; i += 10) {
        doc.line(i, 20, i, pageHeight - 20);
    }
    for (let i = 20; i < pageHeight - 20; i += 10) {
        doc.line(20, i, pageWidth - 20, i);
    }

    // Technical "Circuit" lines in corners
    doc.setDrawColor(79, 70, 229);
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.setLineWidth(0.5);

    // Top-left
    doc.line(20, 40, 40, 40);
    doc.circle(42, 40, 1.5);
    doc.line(20, 50, 30, 50);
    doc.line(30, 50, 40, 60);
    doc.circle(42, 62, 1.5);

    // Bottom-right
    doc.line(pageWidth - 20, pageHeight - 40, pageWidth - 40, pageHeight - 40);
    doc.circle(pageWidth - 42, pageHeight - 40, 1.5);
    doc.line(pageWidth - 20, pageHeight - 50, pageWidth - 30, pageHeight - 50);
    doc.line(pageWidth - 30, pageHeight - 50, pageWidth - 40, pageHeight - 60);
    doc.circle(pageWidth - 42, pageHeight - 62, 1.5);

    // Reset opacity
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 1 }));
    // ----------------------------------------------------

    // Header Logo (100% Transparency/Opaque)
    try {
        doc.addImage(logoUrl, 'JPEG', pageWidth / 2 - 25, 20, 50, 15);
    } catch (e) {
        // Fallback to text if logo fails
        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229);
        doc.setFont("helvetica", "bold");
        doc.text("RAJALAKSHMI INSTITUTE OF TECHNOLOGY", pageWidth / 2, 35, { align: "center" });
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Kuthambakkam, Chennai - 600124", pageWidth / 2, 42, { align: "center" });

    // Title
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("ON-DUTY CERTIFICATE", pageWidth / 2, 62, { align: "center" });

    // Decorative line
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.line(60, 68, pageWidth - 60, 68);

    // Status Badge
    doc.setFillColor(34, 197, 94); // Green
    doc.roundedRect(pageWidth / 2 - 25, 75, 50, 12, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("VERIFIED", pageWidth / 2, 83, { align: "center" });

    // Certificate body
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const bodyY = 105;

    // Technical watermark behind body text
    doc.setFontSize(40);
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 0.03 }));
    doc.setTextColor(79, 70, 229);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            doc.text("RIT", 40 + (i * 45), 90 + (j * 40), { angle: 30 });
        }
    }
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setTextColor(0);
    doc.text("This is to certify that", pageWidth / 2, bodyY, { align: "center" });

    // Student Name (Large)
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(student.name.toUpperCase(), pageWidth / 2, bodyY + 15, { align: "center" });

    // Student Details
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.setFont("helvetica", "normal");
    doc.text(`Register No: ${student.regNo}  |  Department: ${student.department}  |  Batch: ${student.batch}`, pageWidth / 2, bodyY + 25, { align: "center" });

    // Attendance confirmation
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("has attended the following event and their attendance has been officially verified:", pageWidth / 2, bodyY + 40, { align: "center" });

    // Event Details Box
    const boxY = bodyY + 50;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.roundedRect(30, boxY, pageWidth - 60, 50, 5, 5, 'FD');

    // Event Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(record.eventTitle, pageWidth / 2, boxY + 15, { align: "center" });

    // Event Date & Venue
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`Date: ${record.eventDate}`, pageWidth / 2, boxY + 30, { align: "center" });
    doc.text(`Venue: ${record.eventVenue}`, pageWidth / 2, boxY + 40, { align: "center" });

    // Verification Info & QR Code
    const verifyY = boxY + 55;

    // Generate QR Code
    try {
        const verifyUrl = `${window.location.origin}/verify?id=${certificateId}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 100 });
        doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 15, verifyY, 30, 30);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Scan to Verify", pageWidth / 2, verifyY + 35, { align: "center" });
    } catch (err) {
        console.error("QR Code generation failed:", err);
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Certificate ID: ${certificateId}`, pageWidth / 2, verifyY + 45, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, verifyY + 52, { align: "center" });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("This is a digitally generated certificate from the OD Verification System.", pageWidth / 2, pageHeight - 15, { align: "center" });

    // Save
    const fileName = `OD_Certificate_${student.regNo}_${record.eventTitle.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
};
