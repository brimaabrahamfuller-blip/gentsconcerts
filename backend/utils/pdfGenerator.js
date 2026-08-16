const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const generateTicketPDF = async (ticket, event, user, outputPath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Colors
            const navyBlue = '#001F5B';
            const gold = '#C9A84C';
            const darkBg = '#0A0A0F';
            const white = '#FFFFFF';
            const grey = '#A0A0B0';

            // Background
            doc.rect(0, 0, 595.28, 841.89).fill(darkBg);

            // Header Banner
            doc.rect(0, 0, 595.28, 110).fill(navyBlue);
            
            // Header Text
            doc.fontSize(22).fillColor(white).font('Helvetica-Bold').text('GENTS', 40, 35, { continued: true });
            doc.fillColor(gold).text('CONCERTS');
            doc.fontSize(10).fillColor(gold).font('Helvetica').text('E-TICKET', 40, 65, { characterSpacing: 2 });

            let currentY = 130;

            // Flyer Image if available
            const flyerPath = event.flyerImage ? path.join(__dirname, '..', event.flyerImage) : null;
            if (flyerPath && fs.existsSync(flyerPath)) {
                try {
                    doc.image(flyerPath, 147, currentY, { width: 300, height: 200, align: 'center' });
                    currentY += 215;
                } catch (e) {
                    console.error('Failed to render flyer in PDF:', e.message);
                }
            }

            // Details Box
            const details = [
                { label: 'EVENT', value: event.title || 'All Liberian Festival 2026' },
                { label: 'DATE', value: 'August 23, 2026 · 8:00 AM - Late' },
                { label: 'VENUE', value: event.venue || 'ULK Gisozi, Kigali' },
                { label: 'TICKET TIER', value: ticket.tierName || 'Regular Access' },
                { label: 'ATTENDEE', value: user.fullName || ticket.purchaserName || 'Attendee' },
                { label: 'EMAIL', value: user.email || ticket.purchaserEmail || '' },
                { label: 'QUANTITY', value: String(ticket.quantity || 1) },
                { label: 'AMOUNT PAID', value: ticket.totalAmountUSD > 0 ? `$${ticket.totalAmountUSD.toFixed(2)} USD` : '$0.00 USD' },
                { label: 'TICKET ID', value: ticket.qrCode || ticket._id.toString() }
            ];

            doc.font('Helvetica');
            details.forEach(item => {
                doc.fontSize(8).fillColor(gold).text(item.label, 60, currentY);
                doc.fontSize(12).fillColor(white).font('Helvetica-Bold').text(item.value, 60, currentY + 12);
                currentY += 32;
            });

            currentY += 10;

            // QR Code
            const qrText = `https://gentsconcerts.netlify.app/ticket-verify.html?id=${ticket.qrCode || ticket._id}`;
            const qrBuffer = await QRCode.toBuffer(qrText, { width: 140, margin: 1 });
            
            // White background for QR code
            doc.rect(227, currentY, 140, 140).fill(white);
            doc.image(qrBuffer, 227, currentY, { width: 140, height: 140 });
            currentY += 150;

            // Footer
            doc.fontSize(9).fillColor(grey).text('Present this QR code at the venue entrance.', 0, currentY, { align: 'width', align: 'center' });
            doc.fontSize(8).fillColor(gold).text('#GentsConcerts  #Liberia  #Rwanda  #ALF2026', 0, currentY + 15, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateTicketPDF };
