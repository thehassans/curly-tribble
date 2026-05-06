import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

function getLogoPath() {
  const candidates = [
    path.resolve(process.cwd(), 'backend/assets/magnetic-commerce.png'),
    path.resolve(process.cwd(), 'assets/magnetic-commerce.png'),
    path.resolve(process.cwd(), 'magnetic-commerce.png'),
    path.resolve(process.cwd(), '../frontend/public/magnetic-commerce.png'),
    path.resolve(process.cwd(), 'frontend/public/magnetic-commerce.png'),
  ]
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) return file
    } catch {}
  }
  return null
}

function formatCurrency(amount, currency) {
  const value = Number(amount || 0)
  return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function ensureSpace(doc, currentY, neededHeight, margin) {
  if (currentY + neededHeight <= doc.page.height - margin) return currentY
  doc.addPage()
  return margin
}

function drawMetricCard(doc, x, y, width, height, title, value, accent) {
  doc.roundedRect(x, y, width, height, 10).fillAndStroke('#f8fafc', '#dbeafe')
  doc.fontSize(9).font('Helvetica-Bold').fillColor(accent).text(title, x + 12, y + 12, { width: width - 24 })
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text(value, x + 12, y + 32, { width: width - 24 })
}

function drawOrderSection(doc, title, rows, currency, margin, startY) {
  let y = startY
  y = ensureSpace(doc, y, 70, margin)
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a').text(title, margin, y)
  y += 20
  if (!rows.length) {
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('No orders in this section.', margin, y)
    return y + 20
  }

  for (const row of rows) {
    y = ensureSpace(doc, y, 86, margin)
    doc.roundedRect(margin, y, doc.page.width - margin * 2, 74, 10).fillAndStroke('#ffffff', '#e2e8f0')
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`Order #${row.invoiceNumber || 'N/A'}`, margin + 12, y + 10)
    doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Customer: ${row.customerName || '-'} • ${row.customerPhone || '-'}`, margin + 12, y + 28, { width: 320 })
    doc.text(`Product: ${row.productName || '-'}`, margin + 12, y + 42, { width: 320 })
    doc.text(`Location: ${[row.city, row.orderCountry].filter(Boolean).join(', ') || '-'}`, margin + 12, y + 56, { width: 320 })

    const rightX = doc.page.width - margin - 190
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(`Total: ${formatCurrency(row.totalAmount, currency)}`, rightX, y + 10, { width: 178, align: 'right' })
    doc.font('Helvetica').fillColor('#475569').text(`Agent: PKR ${Number(row.agentCommissionPKR || 0).toLocaleString('en-US')}`, rightX, y + 28, { width: 178, align: 'right' })
    doc.text(`Driver: ${formatCurrency(row.driverCommission || 0, currency)}`, rightX, y + 42, { width: 178, align: 'right' })
    doc.text(`When: ${formatDate(row.eventAt)}`, rightX, y + 56, { width: 178, align: 'right' })
    y += 86
  }
  return y
}

export async function generatePartnerClosingPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads')
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

      const timestamp = Date.now()
      const filename = `partner-closing-${timestamp}.pdf`
      const filepath = path.join(uploadsDir, filename)

      const doc = new PDFDocument({ size: 'A4', margin: 32, bufferPages: true })
      const stream = fs.createWriteStream(filepath)
      doc.pipe(stream)

      const margin = 32
      const pageWidth = doc.page.width
      const contentWidth = pageWidth - margin * 2
      let y = margin

      doc.rect(0, 0, pageWidth, 58).fill('#0f172a')
      const logoPath = getLogoPath()
      if (logoPath) {
        try {
          doc.image(logoPath, margin, 10, { width: 38, height: 38, fit: [38, 38] })
        } catch {}
      }
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff').text('PARTNER MANUAL CLOSING REPORT', margin + 50, 18)
      y = 74

      doc.roundedRect(margin, y, contentWidth, 80, 12).fillAndStroke('#f8fafc', '#cbd5e1')
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`Partner: ${data.partnerName || 'Partner'}`, margin + 14, y + 14)
      doc.text(`Country: ${data.country || '-'}`, margin + 14, y + 30)
      doc.text(`Closing Date: ${formatDate(data.closedAt)}`, margin + 14, y + 46)
      doc.font('Helvetica').fillColor('#475569').text(`Period: ${data.rangeLabel || '-'}`, margin + 290, y + 14, { width: 220, align: 'right' })
      doc.text(`Note: ${data.note || '-'}`, margin + 290, y + 30, { width: 220, align: 'right' })
      y += 98

      const summary = data.summary || {}
      const profitLoss = summary.profitLoss || {}
      const purchasing = summary.purchasing || {}
      const cardGap = 12
      const cardWidth = (contentWidth - cardGap) / 2
      drawMetricCard(doc, margin, y, cardWidth, 72, 'Delivered Orders', String(Number(summary.deliveredOrders || 0)), '#059669')
      drawMetricCard(doc, margin + cardWidth + cardGap, y, cardWidth, 72, 'Cancelled Orders', String(Number(summary.cancelledOrders || 0)), '#dc2626')
      y += 84
      drawMetricCard(doc, margin, y, cardWidth, 72, 'Delivered Amount', formatCurrency(summary.deliveredAmount || 0, data.currency), '#0f766e')
      drawMetricCard(doc, margin + cardWidth + cardGap, y, cardWidth, 72, 'Net Profit / Loss', formatCurrency(profitLoss.netAmount || 0, data.currency), Number(profitLoss.netAmount || 0) < 0 ? '#dc2626' : '#2563eb')
      y += 92

      y = ensureSpace(doc, y, 120, margin)
      doc.roundedRect(margin, y, contentWidth, 110, 12).fillAndStroke('#ffffff', '#e2e8f0')
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Closing Financial Details', margin + 14, y + 14)
      const leftX = margin + 14
      const rightX = margin + contentWidth / 2 + 10
      doc.fontSize(10).font('Helvetica').fillColor('#475569')
      doc.text(`Agent Commission: ${formatCurrency(profitLoss.agentCommission || 0, data.currency)}`, leftX, y + 40)
      doc.text(`Driver Commission: ${formatCurrency(profitLoss.driverCommission || 0, data.currency)}`, leftX, y + 58)
      doc.text(`Dropshipper Commission: ${formatCurrency(profitLoss.dropshipperCommission || 0, data.currency)}`, leftX, y + 76)
      doc.text(`Purchasing: ${formatCurrency(profitLoss.purchasing || 0, data.currency)}`, rightX, y + 40)
      doc.text(`Expense: ${formatCurrency(profitLoss.expense || 0, data.currency)}`, rightX, y + 58)
      doc.text(`Stock Delivered Qty: ${Number(purchasing.stockDeliveredQty || 0)}`, rightX, y + 76)
      y += 132

      y = drawOrderSection(doc, 'Delivered Orders Included In Closing', Array.isArray(data.deliveredOrders) ? data.deliveredOrders : [], data.currency, margin, y)
      y += 10
      y = drawOrderSection(doc, 'Cancelled / Returned Orders Included In Closing', Array.isArray(data.cancelledOrders) ? data.cancelledOrders : [], data.currency, margin, y)
      y += 16

      y = ensureSpace(doc, y, 70, margin)
      doc.roundedRect(margin, y, contentWidth, 54, 10).fillAndStroke('#0f172a', '#0f172a')
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('Manual closing completed. Future totals start after this close.', margin + 16, y + 18)

      const range = doc.bufferedPageRange()
      for (let i = 0; i < range.count; i += 1) {
        doc.switchToPage(i)
        doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`Page ${i + 1} of ${range.count}`, margin, doc.page.height - 24, {
          width: contentWidth,
          align: 'center',
        })
      }

      doc.end()
      stream.on('finish', () => resolve(`/uploads/${filename}`))
      stream.on('error', reject)
    } catch (error) {
      reject(error)
    }
  })
}
