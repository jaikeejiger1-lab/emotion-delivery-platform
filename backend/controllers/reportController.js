/**
 * reportController.js — Executive Reporting & Business Analytics Engine
 *
 * Generates aggregated data reports for Sales, Orders, and Users.
 * Formats outputs as CSV, Excel (.xlsx), or formatted PDF documents.
 */
const Order = require('../models/Order');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Optional dynamic imports with robust native fallback
let exceljs = null;
let PDFDocument = null;
try { exceljs = require('exceljs'); } catch {}
try { PDFDocument = require('pdfkit'); } catch {}

// Helper: Convert array of objects to CSV string
const convertToCSV = (headers, rows) => {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    if (str.search(/("|,|\n)/g) >= 0) return `"${str}"`;
    return str;
  };

  const csvHeaders = headers.map(h => escapeCell(h.label)).join(',');
  const csvRows = rows.map(row => headers.map(h => escapeCell(row[h.key])).join(','));
  return [csvHeaders, ...csvRows].join('\r\n');
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/reports/download
// Query params: type (sales | orders | users), format (csv | excel | pdf), startDate, endDate
// ─────────────────────────────────────────────────────────────────────
exports.downloadReport = async (req, res, next) => {
  try {
    const { type = 'sales', format = 'csv', startDate, endDate } = req.query;

    const validTypes = ['sales', 'orders', 'users'];
    const validFormats = ['csv', 'excel', 'pdf'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid report type. Allowed: ${validTypes.join(', ')}` });
    }
    if (!validFormats.includes(format)) {
      return res.status(400).json({ success: false, message: `Invalid report format. Allowed: ${validFormats.join(', ')}` });
    }

    // Build Date Filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    let reportTitle = '';
    let headers = [];
    let rows = [];

    // ── 1. Fetch & Shape Data by Type ───────────────────────────────
    if (type === 'sales') {
      reportTitle = 'Executive Revenue & Sales Analytics';
      const orders = await Order.find(dateFilter).populate('userId', 'firstName lastName email').sort({ createdAt: -1 });

      headers = [
        { label: 'Order Number', key: 'orderNumber' },
        { label: 'Date', key: 'date' },
        { label: 'Customer Name', key: 'customer' },
        { label: 'Items Count', key: 'itemsCount' },
        { label: 'Subtotal (INR)', key: 'subtotal' },
        { label: 'Tax (INR)', key: 'tax' },
        { label: 'Shipping (INR)', key: 'shipping' },
        { label: 'Total Revenue (INR)', key: 'total' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Order Status', key: 'status' },
      ];

      rows = orders.map(ord => ({
        orderNumber: ord.orderNumber || `EDP-${ord._id.toString().slice(-6).toUpperCase()}`,
        date: new Date(ord.createdAt).toLocaleDateString('en-IN'),
        customer: ord.userId ? `${ord.userId.firstName} ${ord.userId.lastName}` : 'Guest User',
        itemsCount: ord.items?.length || 0,
        subtotal: ord.pricing?.subtotal || 0,
        tax: ord.pricing?.tax || 0,
        shipping: ord.pricing?.shipping || 0,
        total: ord.pricing?.total || 0,
        paymentMethod: (ord.payment?.method || 'ONLINE').toUpperCase(),
        status: ord.status,
      }));
    } else if (type === 'orders') {
      reportTitle = 'Consolidated Fulfillment & Logistics Report';
      const orders = await Order.find(dateFilter).populate('userId', 'firstName lastName phone').sort({ createdAt: -1 });

      headers = [
        { label: 'Order Number', key: 'orderNumber' },
        { label: 'Customer Name', key: 'customer' },
        { label: 'Contact Phone', key: 'phone' },
        { label: 'Recipient Name', key: 'recipient' },
        { label: 'Delivery City', key: 'city' },
        { label: 'Scheduled Date', key: 'scheduledDate' },
        { label: 'Time Slot', key: 'timeSlot' },
        { label: 'Status', key: 'status' },
        { label: 'Total Paid (INR)', key: 'total' },
      ];

      rows = orders.map(ord => ({
        orderNumber: ord.orderNumber || `EDP-${ord._id.toString().slice(-6).toUpperCase()}`,
        customer: ord.userId ? `${ord.userId.firstName} ${ord.userId.lastName}` : 'Guest',
        phone: ord.deliveryAddress?.phone || ord.userId?.phone || '—',
        recipient: ord.deliveryAddress?.recipientName || '—',
        city: ord.deliveryAddress?.city || '—',
        scheduledDate: ord.scheduledDelivery?.date ? new Date(ord.scheduledDelivery.date).toLocaleDateString('en-IN') : '—',
        timeSlot: ord.scheduledDelivery?.timeSlot || 'Standard',
        status: ord.status,
        total: ord.pricing?.total || 0,
      }));
    } else if (type === 'users') {
      reportTitle = 'Registered Users & Fleet Directory';
      const users = await User.find(dateFilter).select('firstName lastName email phone role isActive isBanned createdAt').sort({ createdAt: -1 });

      headers = [
        { label: 'User ID', key: 'id' },
        { label: 'First Name', key: 'firstName' },
        { label: 'Last Name', key: 'lastName' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Role', key: 'role' },
        { label: 'Account Status', key: 'status' },
        { label: 'Registered Date', key: 'registeredDate' },
      ];

      rows = users.map(u => ({
        id: u._id.toString(),
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '—',
        phone: u.phone || '—',
        role: u.role.toUpperCase(),
        status: u.isBanned ? 'Banned' : u.isActive ? 'Active' : 'Suspended',
        registeredDate: new Date(u.createdAt).toLocaleDateString('en-IN'),
      }));
    }

    // Log Compliance Audit Record
    AuditLog.create({
      performedBy: req.user._id,
      action: 'DOWNLOAD_REPORT',
      targetCollection: type.toUpperCase(),
      description: `Admin generated ${type} report formatted as ${format.toUpperCase()} (${rows.length} records)`,
      metadata: { type, format, startDate, endDate, recordsCount: rows.length },
    }).catch(() => {});

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `EmotionDelivery_${type}_Report_${timestamp}`;

    // ── 2. Format & Stream Output ───────────────────────────────────

    // Format A: CSV
    if (format === 'csv') {
      const csvString = convertToCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvString);
    }

    // Format B: Excel (.xlsx)
    if (format === 'excel') {
      if (exceljs) {
        const workbook = new exceljs.Workbook();
        workbook.creator = 'Emotion Delivery Platform';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(type.toUpperCase());

        // Title row
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `${reportTitle} (${rows.length} Records)`;
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE85D9A' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 36;

        // Space row
        worksheet.addRow([]);

        // Header row
        const headerRow = worksheet.addRow(headers.map(h => h.label));
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E3F' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 24;

        // Data rows
        rows.forEach(r => {
          worksheet.addRow(headers.map(h => r[h.key]));
        });

        // Auto-fit columns
        worksheet.columns.forEach((col, idx) => {
          let maxLen = headers[idx] ? headers[idx].label.length : 12;
          col.eachCell({ includeEmpty: false }, cell => {
            const valLen = cell.value ? cell.value.toString().length : 10;
            if (valLen > maxLen) maxLen = valLen;
          });
          col.width = Math.min(Math.max(maxLen + 3, 12), 40);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

        const buffer = await workbook.xlsx.writeBuffer();
        return res.send(buffer);
      } else {
        // Fallback if exceljs not loaded: send CSV buffer with .csv extension
        const csvString = convertToCSV(headers, rows);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvString);
      }
    }

    // Format C: PDF
    if (format === 'pdf') {
      if (PDFDocument) {
        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

        doc.pipe(res);

        // Header Banner
        doc.rect(0, 0, doc.page.width, 70).fill('#0A0A14');
        doc.fillColor('#E85D9A').fontSize(22).text('EMOTION DELIVERY PLATFORM', 40, 20);
        doc.fillColor('#FFFFFF').fontSize(11).text(`${reportTitle} | Generated: ${new Date().toLocaleString()}`, 40, 48);

        let y = 95;
        doc.fillColor('#14142B').fontSize(13).text(`Total Records Extracted: ${rows.length}`, 40, y);
        y += 25;

        // Table Header
        const colWidth = (doc.page.width - 80) / Math.min(headers.length, 7);
        const displayHeaders = headers.slice(0, 7); // Display up to 7 columns neatly on PDF

        doc.rect(40, y, doc.page.width - 80, 26).fill('#1E1E3F');
        doc.fillColor('#FFFFFF').fontSize(9);
        displayHeaders.forEach((h, idx) => {
          doc.text(h.label, 45 + idx * colWidth, y + 8, { width: colWidth - 10, ellipsis: true });
        });
        y += 26;

        // Table Rows
        rows.forEach((r, rowIdx) => {
          if (y > doc.page.height - 60) {
            doc.addPage({ layout: 'landscape' });
            y = 40;
          }

          if (rowIdx % 2 === 0) {
            doc.rect(40, y, doc.page.width - 80, 22).fill('#F8F9FC');
          }
          doc.fillColor('#333333').fontSize(8);
          displayHeaders.forEach((h, idx) => {
            const val = r[h.key] !== undefined && r[h.key] !== null ? String(r[h.key]) : '';
            doc.text(val, 45 + idx * colWidth, y + 6, { width: colWidth - 10, ellipsis: true });
          });
          y += 22;
        });

        doc.end();
        return;
      } else {
        // Fallback if pdfkit unset: return CSV
        const csvString = convertToCSV(headers, rows);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvString);
      }
    }

  } catch (error) {
    next(error);
  }
};
