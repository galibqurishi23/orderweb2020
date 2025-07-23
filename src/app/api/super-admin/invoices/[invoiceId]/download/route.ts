import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { invoiceId } = params;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Get invoice details
    const [invoiceRows] = await db.execute(
      `SELECT b.*, t.name as tenant_name, t.email as tenant_email, t.address as tenant_address, t.phone as tenant_phone
       FROM billing b
       JOIN tenants t ON b.tenant_id = t.id
       WHERE b.id = ?`,
      [invoiceId]
    );

    const invoices = invoiceRows as any[];
    if (!invoices || invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoices[0];

    // Generate smart PDF
    const pdfBuffer = generateSmartInvoicePDF(invoice);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.id.slice(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download invoice' },
      { status: 500 }
    );
  }
}

function generateSmartInvoicePDF(invoice: any): Buffer {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;

  // Colors
  const primaryColor = '#1e40af'; // Blue
  const secondaryColor = '#64748b'; // Gray
  const accentColor = '#059669'; // Green

  // Header Section
  pdf.setFillColor(30, 64, 175); // Primary blue
  pdf.rect(0, 0, pageWidth, 40, 'F');

  // Company Logo/Name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OrderWeb', 20, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Restaurant Management System', 20, 32);

  // Invoice title and number
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 60, 20);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`#${invoice.id.slice(0, 8).toUpperCase()}`, pageWidth - 60, 30);

  // Reset text color for body
  pdf.setTextColor(0, 0, 0);

  // Invoice Details Box
  let yPos = 60;
  
  // Bill To Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.text('Bill To:', 20, yPos);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  yPos += 8;
  pdf.text(invoice.tenant_name || 'Restaurant Name', 20, yPos);
  yPos += 6;
  if (invoice.tenant_address) {
    const addressLines = pdf.splitTextToSize(invoice.tenant_address, 80);
    pdf.text(addressLines, 20, yPos);
    yPos += addressLines.length * 6;
  }
  pdf.text(invoice.tenant_email || '', 20, yPos);
  yPos += 6;
  if (invoice.tenant_phone) {
    pdf.text(invoice.tenant_phone, 20, yPos);
  }

  // Invoice Info Box (Right side)
  const infoX = pageWidth - 80;
  yPos = 60;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Invoice Date:', infoX, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text(new Date(invoice.created_at).toLocaleDateString('en-GB'), infoX + 30, yPos);
  
  yPos += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Due Date:', infoX, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text(new Date(invoice.due_date).toLocaleDateString('en-GB'), infoX + 30, yPos);

  yPos += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Status:', infoX, yPos);
  pdf.setFont('helvetica', 'normal');
  
  // Status with color coding
  const status = invoice.status.toUpperCase();
  if (status === 'PAID') {
    pdf.setTextColor(5, 150, 105); // Green
  } else if (status === 'PENDING') {
    pdf.setTextColor(245, 158, 11); // Yellow
  } else {
    pdf.setTextColor(239, 68, 68); // Red
  }
  pdf.text(status, infoX + 30, yPos);

  // Items Table
  yPos = 130;
  
  // Table Header
  pdf.setFillColor(248, 250, 252); // Light gray
  pdf.rect(20, yPos, pageWidth - 40, 12, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  yPos += 8;
  pdf.text('Description', 25, yPos);
  pdf.text('Period', 120, yPos);
  pdf.text('Amount', pageWidth - 50, yPos);

  // Table Row
  yPos += 15;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Description with word wrap
  const description = invoice.description || 'OrderWeb Restaurant Management System';
  const splitDescription = pdf.splitTextToSize(description, 90);
  pdf.text(splitDescription, 25, yPos);
  
  // Billing period
  const startDate = new Date(invoice.billing_period_start).toLocaleDateString('en-GB');
  const endDate = new Date(invoice.billing_period_end).toLocaleDateString('en-GB');
  const period = `${startDate} - ${endDate}`;
  const splitPeriod = pdf.splitTextToSize(period, 40);
  pdf.text(splitPeriod, 120, yPos);
  
  pdf.text(`£${parseFloat(invoice.amount).toFixed(2)}`, pageWidth - 50, yPos);

  // Divider line
  yPos += Math.max(splitDescription.length * 6, splitPeriod.length * 6, 10) + 10;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(20, yPos, pageWidth - 20, yPos);

  // Totals Section
  yPos += 20;
  const totalsX = pageWidth - 80;
  const amount = parseFloat(invoice.amount);
  const vatRate = 20; // 20% VAT
  const vatAmount = amount * (vatRate / 100);
  const totalAmount = amount + vatAmount;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Subtotal:', totalsX - 30, yPos);
  pdf.text(`£${amount.toFixed(2)}`, totalsX + 20, yPos);
  
  yPos += 8;
  pdf.text(`VAT (${vatRate}%):`, totalsX - 30, yPos);
  pdf.text(`£${vatAmount.toFixed(2)}`, totalsX + 20, yPos);
  
  yPos += 12;
  pdf.setDrawColor(30, 64, 175);
  pdf.line(totalsX - 35, yPos - 2, pageWidth - 20, yPos - 2);
  
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(5, 150, 105); // Green
  pdf.text('Total:', totalsX - 30, yPos + 5);
  pdf.text(`£${totalAmount.toFixed(2)}`, totalsX + 20, yPos + 5);

  // Payment Terms Section
  yPos += 30;
  if (yPos < pageHeight - 60) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text('Payment Terms & Information', 20, yPos);
    
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    const terms = [
      '• Payment is due within 30 days of invoice date',
      '• Late payments may incur additional charges',
      '• For support, contact: support@orderweb.com',
      '• Thank you for choosing OrderWeb Restaurant Management System'
    ];
    
    terms.forEach(term => {
      pdf.text(term, 20, yPos);
      yPos += 6;
    });
  }

  // Footer
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'italic');
  const footerText = 'This invoice was generated automatically by OrderWeb System';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);

  // Generate PDF buffer
  return Buffer.from(pdf.output('arraybuffer'));
}
