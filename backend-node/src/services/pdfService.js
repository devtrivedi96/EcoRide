const PDFDocument = require('pdfkit');

/**
 * Equivalent to Spring Boot PdfReportService
 */

function generateEmployeePdfReport(userEmail, trips) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).fillColor('#1a1a2e').text('RideConnect — My Trips Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#555').text(`Employee: ${userEmail}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e0e0e0');
    doc.moveDown(1);

    if (trips.length === 0) {
      doc.fontSize(12).fillColor('#888').text('No trips found.', { align: 'center' });
    } else {
      trips.forEach((trip, i) => {
        doc.fontSize(13).fillColor('#0f3460').text(`Trip #${i + 1} — ${trip.status}`);
        doc.fontSize(10).fillColor('#333');
        doc.text(`From: ${trip.ride?.pickupLocation || 'N/A'}   →   To: ${trip.ride?.destination || 'N/A'}`);
        doc.text(`Departure: ${trip.ride?.departureTime ? new Date(trip.ride.departureTime).toLocaleString('en-IN') : 'N/A'}`);
        doc.text(`Driver: ${trip.ride?.driver?.firstName || ''} ${trip.ride?.driver?.lastName || ''}`);
        doc.text(`Seats Booked: ${trip.bookedSeats}   |   Total Fare: ₹${trip.totalFare}`);
        doc.moveDown(0.8);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#eeeeee');
        doc.moveDown(0.5);
      });
    }

    doc.end();
  });
}

function generateAdminAnalyticsPdfReport(dto) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#1a1a2e').text('RideConnect — Analytics Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#555').text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e0e0e0');
    doc.moveDown(1);

    const rows = [
      ['Total Trips', dto.totalTrips],
      ['Total Distance Travelled', `${dto.totalDistanceTravelledKm} km`],
      ['Estimated Fuel Consumption', `${dto.estimatedFuelConsumptionLiters.toFixed(2)} L`],
      ['Total Cost Saved (vs Cab)', `₹${dto.totalCostSaved.toFixed(2)}`],
      ['Cost per Kilometre', `₹${dto.costPerKilometer}`],
    ];

    rows.forEach(([label, value]) => {
      doc.fontSize(12).fillColor('#0f3460').text(label, { continued: true });
      doc.fillColor('#333').text(`:  ${value}`, { align: 'right' });
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

module.exports = { generateEmployeePdfReport, generateAdminAnalyticsPdfReport };
