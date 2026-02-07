import jsPDF from "jspdf";
import "jspdf-autotable";
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

export const generateAttendancePDF = (userName: string, email: string, records: AttendanceRecord[]) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text("On-Duty Attendance Certificate", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: "center" });

    // Student Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Student Information", 20, 45);
    doc.setFontSize(11);
    doc.text(`Name: ${userName}`, 20, 52);
    doc.text(`Email: ${email}`, 20, 58);

    // Table
    const tableColumn = ["Event Title", "Date", "Venue", "Status"];
    const tableRows = records.map(record => [
        record.eventTitle,
        record.eventDate,
        record.eventVenue,
        record.status
    ]);

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        styles: { fontSize: 10 },
        headStyles: { fillStyle: 'DF', fillColor: [79, 70, 229] }, // Primary color
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("This is a computer-generated document and requires no signature.", 105, finalY + 20, { align: "center" });

    doc.save(`Attendance_${userName.replace(/\s+/g, '_')}.pdf`);
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
