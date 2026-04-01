import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (order) => {
    console.log("Generating PDF for order:", order);
    
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            floatPrecision: 16
        });

        // Brand and Header
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246); // Blue-500
        doc.text('KIRANA', 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Gray-500
        doc.text('Wholesale B2B Ecosystem', 20, 26);
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('TAX INVOICE', 140, 20);
        doc.setFontSize(9);
        doc.text(`Invoice #: ${order.order_number}`, 140, 26);
        doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 140, 31);

        // Business Details Row
        doc.setDrawColor(226, 232, 240); // Gray-200
        doc.line(20, 40, 190, 40);

        // From: Dealer
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('FROM (Dealer):', 20, 50);
        doc.setFont(undefined, 'normal');
        doc.text(order.dealer_business_name || order.dealer_name || 'Dealer Name', 20, 56);
        doc.setFontSize(8);
        doc.text('GSTIN: MOCK_GST_DEALER_123', 20, 61);

        // To: Shopkeeper
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('TO (Shopkeeper):', 110, 50);
        doc.setFont(undefined, 'normal');
        const shopkeeperName = order.shopkeeper_business_name || order.shopkeeper_name || 'Shopkeeper Name';
        doc.text(shopkeeperName, 110, 56);
        doc.setFontSize(8);
        doc.text('Shipping Address:', 110, 61);
        const addressLines = doc.splitTextToSize(order.shipping_address || 'N/A', 70);
        doc.text(addressLines, 110, 66);

        // Table
        const tableData = (order.items || []).map((item, idx) => [
            idx + 1,
            item.product_name,
            `${item.quantity} ${item.unit || 'unit'}`,
            `₹${item.product_price}`,
            `₹${(item.subtotal || (Number(item.product_price) * Number(item.quantity))).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 85,
            head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Subtotal']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' },
            }
        });

        // Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        
        doc.setFontSize(10);
        doc.text('Order Summary:', 130, finalY);
        
        doc.setFont(undefined, 'normal');
        doc.text('Subtotal:', 130, finalY + 8);
        const subtotal = Number(order.total_amount || 0);
        doc.text(`₹${subtotal.toLocaleString()}`, 175, finalY + 8, { align: 'right' });
        
        const discount = Number(order.discount || 0);
        if (discount > 0) {
            doc.setTextColor(239, 68, 68);
            doc.text('Discount:', 130, finalY + 14);
            doc.text(`-₹${discount.toLocaleString()}`, 175, finalY + 14, { align: 'right' });
            doc.setTextColor(0, 0, 0);
        }

        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Total Payable:', 130, finalY + 22);
        const totalPayable = Number(order.net_amount || order.total_amount || 0);
        doc.text(`₹${totalPayable.toLocaleString()}`, 175, finalY + 22, { align: 'right' });

        // Footer / Trust Note
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Thank you for your business! This is a system-generated invoice.', 20, 280);
        doc.text('Powered by KIRANA Wholesales', 160, 280);

        doc.save(`Invoice_${order.order_number}.pdf`);
        console.log("PDF saved successfully");
    } catch (error) {
        console.error("Failed to generate PDF:", error);
    }
};

