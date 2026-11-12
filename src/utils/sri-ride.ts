/**
 * Generador e Impresor Oficial de RIDE SRI Ecuador y Ticket Térmico 80mm
 * Incluye generador de Código de Barras Code 128 SVG puro (sin dependencias externas).
 */

// Patrones oficiales Code 128 (anchos de barras y espacios, suma de cada patrón = 11 módulos, stop = 13)
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], [2, 2, 2, 1, 2, 2], [2, 2, 2, 2, 2, 1], [1, 2, 1, 2, 2, 3], [1, 2, 1, 3, 2, 2], // 0-4
  [1, 3, 1, 2, 2, 2], [1, 2, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2], [1, 3, 2, 2, 1, 2], [2, 2, 1, 2, 1, 3], // 5-9
  [2, 2, 1, 3, 1, 2], [2, 3, 1, 2, 1, 2], [1, 1, 2, 2, 3, 2], [1, 2, 2, 1, 3, 2], [1, 2, 2, 2, 3, 1], // 10-14
  [1, 1, 3, 2, 2, 2], [1, 2, 3, 1, 2, 2], [1, 2, 3, 2, 2, 1], [2, 2, 3, 2, 1, 1], [2, 2, 1, 1, 3, 2], // 15-19
  [2, 2, 1, 2, 3, 1], [2, 1, 3, 2, 1, 2], [2, 2, 3, 1, 1, 2], [3, 1, 2, 1, 3, 1], [3, 1, 1, 2, 2, 2], // 20-24
  [3, 2, 1, 1, 2, 2], [3, 2, 1, 2, 2, 1], [3, 1, 2, 2, 1, 2], [3, 2, 2, 1, 1, 2], [3, 2, 2, 2, 1, 1], // 25-29
  [2, 1, 2, 1, 2, 3], [2, 1, 2, 3, 2, 1], [2, 3, 2, 1, 2, 1], [1, 1, 1, 3, 2, 3], [1, 3, 1, 1, 2, 3], // 30-34
  [1, 3, 1, 3, 2, 1], [1, 1, 2, 3, 1, 3], [1, 3, 2, 1, 1, 3], [1, 3, 2, 3, 1, 1], [2, 1, 1, 3, 1, 3], // 35-39
  [2, 3, 1, 1, 1, 3], [2, 3, 1, 3, 1, 1], [1, 1, 2, 1, 3, 3], [1, 1, 2, 3, 3, 1], [1, 3, 2, 1, 3, 1], // 40-44
  [1, 1, 3, 1, 2, 3], [1, 1, 3, 3, 2, 1], [1, 3, 3, 1, 2, 1], [3, 1, 3, 1, 2, 1], [2, 1, 1, 3, 3, 1], // 45-49
  [2, 3, 1, 1, 3, 1], [2, 1, 3, 1, 1, 3], [2, 1, 3, 3, 1, 1], [2, 1, 3, 1, 3, 1], [3, 1, 1, 1, 2, 3], // 50-54
  [3, 1, 1, 3, 2, 1], [3, 3, 1, 1, 2, 1], [3, 1, 2, 1, 1, 3], [3, 1, 2, 3, 1, 1], [3, 3, 2, 1, 1, 1], // 55-59
  [3, 1, 4, 1, 1, 1], [2, 2, 1, 4, 1, 1], [4, 3, 1, 1, 1, 1], [1, 1, 1, 2, 2, 4], [1, 1, 1, 4, 2, 2], // 60-64
  [1, 2, 1, 1, 2, 4], [1, 2, 1, 4, 2, 1], [1, 4, 1, 1, 2, 2], [1, 4, 1, 2, 2, 1], [1, 1, 2, 2, 1, 4], // 65-69
  [1, 1, 2, 4, 1, 2], [1, 2, 2, 1, 1, 4], [1, 2, 2, 4, 1, 1], [1, 4, 2, 1, 1, 2], [1, 4, 2, 2, 1, 1], // 70-74
  [2, 4, 1, 2, 1, 1], [2, 2, 1, 1, 1, 4], [4, 1, 3, 1, 1, 1], [2, 4, 1, 1, 1, 2], [1, 3, 4, 1, 1, 1], // 75-79
  [1, 1, 1, 2, 4, 2], [1, 2, 1, 1, 4, 2], [1, 2, 1, 2, 4, 1], [1, 1, 4, 2, 1, 2], [1, 2, 4, 1, 1, 2], // 80-84
  [1, 2, 4, 2, 1, 1], [4, 1, 1, 2, 1, 2], [4, 2, 1, 1, 1, 2], [4, 2, 1, 2, 1, 1], [2, 1, 2, 1, 4, 1], // 85-89
  [2, 1, 4, 1, 2, 1], [4, 1, 2, 1, 2, 1], [1, 1, 1, 1, 4, 3], [1, 1, 1, 3, 4, 1], [1, 3, 1, 1, 4, 1], // 90-94
  [1, 1, 4, 1, 1, 3], [1, 1, 4, 3, 1, 1], [4, 1, 1, 1, 1, 3], [4, 1, 1, 3, 1, 1], [1, 1, 3, 1, 4, 1], // 95-99
  [1, 1, 4, 1, 3, 1], [3, 1, 1, 1, 4, 1], [4, 1, 1, 1, 3, 1], [2, 1, 1, 4, 1, 2], [2, 1, 1, 2, 1, 4], // 100-104
  [2, 1, 1, 2, 3, 2], // 105: Start C
  [2, 3, 3, 1, 1, 1, 2], // 106: STOP (7 módulos)
]

/**
 * Codifica una clave de acceso numérica (49 dígitos SRI) en Code 128 C/B
 * y genera un SVG puro sin dependencias.
 */
export function generateBarcode128Svg(
  numericCode: string,
  options: { height?: number; barWidth?: number; showText?: boolean } = {}
): string {
  const code = (numericCode || '').replace(/\D/g, '')
  if (!code) return ''

  const height = options.height || 45
  const barWidth = options.barWidth || 1.15
  const showText = options.showText !== false

  const symbols: number[] = []
  // Start with Code C (105)
  symbols.push(105)

  // Encode pairs of digits using Code C
  let i = 0
  while (i < code.length) {
    if (i + 1 < code.length) {
      symbols.push(parseInt(code.slice(i, i + 2), 10))
      i += 2
    } else {
      // Single digit left: switch to Code B (100) and encode digit
      symbols.push(100)
      symbols.push(code.charCodeAt(i) - 32)
      i++
    }
  }

  // Calculate Checksum
  let checksum = symbols[0] || 105
  for (let j = 1; j < symbols.length; j++) {
    const sym = symbols[j] ?? 0
    checksum += sym * j
  }
  symbols.push(checksum % 103)
  // Stop character
  symbols.push(106)

  // Render bars
  let svgBars = ''
  let currentX = 10 // Quiet zone

  for (const sym of symbols) {
    const pattern = CODE128_PATTERNS[sym]
    if (!pattern) continue
    let isBar = true
    for (const w of pattern) {
      const pxWidth = w * barWidth
      if (isBar) {
        svgBars += `<rect x="${currentX.toFixed(2)}" y="0" width="${pxWidth.toFixed(2)}" height="${height}" fill="#000" />`
      }
      currentX += pxWidth
      isBar = !isBar
    }
  }

  const totalWidth = currentX + 10 // Quiet zone end
  const totalSvgHeight = showText ? height + 16 : height

  let textSvg = ''
  if (showText) {
    textSvg = `<text x="${(totalWidth / 2).toFixed(2)}" y="${height + 12}" font-family="monospace" font-size="10" text-anchor="middle" fill="#000">${code}</text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(2)} ${totalSvgHeight}" width="100%" height="${totalSvgHeight}px" preserveAspectRatio="xMidYMid meet" style="display:block;margin:0 auto">${svgBars}${textSvg}</svg>`
}

const esc = (s: any) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

const formatNum = (v: any) => {
  const n = Number(v || 0)
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const PAYMENT_NAMES: Record<string, string> = {
  '01': 'SIN UTILIZACION DEL SISTEMA FINANCIERO (EFECTIVO)',
  '16': 'TARJETA DE DEBITO',
  '19': 'TARJETA DE CREDITO',
  '20': 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO (TRANSFERENCIA / CHEQUE)',
}

/**
 * Genera el documento HTML oficial RIDE (A4) según la normativa del SRI Ecuador
 */
export function generateRideA4Html(inv: any, company: any): string {
  const isPruebas = String(company?.sri_environment || inv?.sri_environment || '1') === '1'
  const barcodeSvg = inv?.access_key ? generateBarcode128Svg(inv.access_key, { height: 40, showText: false }) : ''
  const isInvoice = (inv?.document_type || '01') === '01'
  const docTitle = isInvoice ? 'FACTURA' : 'NOTA DE CRÉDITO'

  const detailsRows = (inv.details || [])
    .map(
      (d: any, idx: number) => `<tr>
        <td style="text-align:center">${esc(d.code || `ITEM-${idx + 1}`)}</td>
        <td style="text-align:center">${esc(d.quantity)}</td>
        <td>${esc(d.description)}</td>
        <td style="text-align:right">${formatNum(d.unit_price)}</td>
        <td style="text-align:right">${formatNum(d.discount)}</td>
        <td style="text-align:right">${formatNum(d.total)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${docTitle} ${esc(inv.invoice_number || inv.credit_note_number)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; background: #fff; }
    .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
    .box { border: 1.5px solid #222; border-radius: 8px; padding: 10px; background: #fff; }
    .company-title { font-size: 15px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
    .company-trade { font-size: 12px; font-weight: 600; color: #444; margin-bottom: 8px; }
    .ruc-box-title { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
    .doc-type-title { font-size: 18px; font-weight: 800; margin: 4px 0; color: #000; }
    .doc-number { font-size: 15px; font-weight: bold; font-family: monospace; margin-bottom: 6px; }
    .access-key { font-family: monospace; font-size: 10.5px; word-break: break-all; text-align: center; margin: 4px 0 8px 0; letter-spacing: 0.5px; }
    .client-box { border: 1.5px solid #222; border-radius: 8px; padding: 10px; margin-bottom: 12px; }
    .client-grid { display: grid; grid-template-columns: 2fr 1fr; row-gap: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10.5px; }
    th { background: #f0f0f0; border: 1px solid #333; padding: 5px; font-weight: bold; text-align: center; }
    td { border: 1px solid #444; padding: 4px 6px; }
    .bottom-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; margin-top: 10px; }
    .totals-table { width: 100%; font-size: 11px; }
    .totals-table td { padding: 4px 6px; }
    .totals-table tr td:last-child { text-align: right; font-family: monospace; font-size: 11.5px; font-weight: 600; }
    .grand-total { font-size: 13px !important; font-weight: bold !important; background: #eee; }
    .payments-table { font-size: 10px; margin-top: 6px; }
    .barcode-container { margin: 6px 0; background: #fff; padding: 4px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header-grid">
    <!-- Emisor / Empresa -->
    <div class="box d-flex flex-column justify-content-between">
      <div>
        <div class="company-title">${esc(company.business_name || company.razon_social || 'EMPRESA')}</div>
        <div class="company-trade">${esc(company.trade_name || company.nombre_comercial || '')}</div>
        <div style="margin-top: 6px; line-height: 1.4;">
          <b>Dirección Matriz:</b> ${esc(company.address_matriz || 'Ecuador')}<br>
          <b>Dirección Sucursal:</b> ${esc(inv.branch_address || company.address_matriz || 'Ecuador')}<br>
          ${company.special_taxpayer ? `<b>Contribuyente Especial Nro:</b> ${esc(company.special_taxpayer)}<br>` : ''}
          <b>OBLIGADO A LLEVAR CONTABILIDAD:</b> ${company.obligated_accounting ? 'SI' : 'NO'}<br>
          ${company.tax_regime === 'RIMPE_EMPRENDEDOR' ? '<b>CONTRIBUYENTE RÉGIMEN RIMPE</b><br>' : ''}
          ${company.tax_regime === 'RIMPE_NEGOCIO_POPULAR' ? '<b>CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE</b><br>' : ''}
        </div>
      </div>
    </div>

    <!-- RUC y Autorización SRI -->
    <div class="box">
      <div class="ruc-box-title">R.U.C.: ${esc(company.ruc || '')}</div>
      <div class="doc-type-title">${docTitle}</div>
      <div class="doc-number">No. ${esc(inv.invoice_number || inv.credit_note_number || '001-001-000000001')}</div>
      <div style="line-height: 1.35; margin-bottom: 4px;">
        <b>NÚMERO DE AUTORIZACIÓN:</b><br>
        <span style="font-family: monospace; font-size: 10.5px;">${esc(inv.sri_authorization_number || inv.access_key || 'PENDIENTE')}</span><br>
        <b>FECHA Y HORA DE AUTORIZACIÓN:</b> ${esc(inv.sri_authorization_date ? new Date(inv.sri_authorization_date).toLocaleString('es-EC') : 'NO AUTORIZADO')}<br>
        <b>AMBIENTE:</b> ${isPruebas ? 'PRUEBAS' : 'PRODUCCIÓN'}<br>
        <b>EMISIÓN:</b> NORMAL<br>
        <b>CLAVE DE ACCESO:</b>
      </div>
      <div class="barcode-container">
        ${barcodeSvg}
      </div>
      <div class="access-key">${esc(inv.access_key || '')}</div>
    </div>
  </div>

  <!-- Info Cliente / Comprador -->
  <div class="client-box">
    <div class="client-grid">
      <div><b>Razón Social / Nombres y Apellidos:</b> ${esc(inv.customer_name)}</div>
      <div><b>Identificación:</b> ${esc(inv.customer_id_number)}</div>
      <div><b>Fecha Emisión:</b> ${esc(inv.issue_date)}</div>
      <div><b>Guía de Remisión:</b> ${esc(inv.remission_guide || '')}</div>
      <div style="grid-column: span 2;"><b>Dirección:</b> ${esc(inv.customer_address || 'S/N')}</div>
    </div>
  </div>

  <!-- Tabla de Detalles -->
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Cod. Principal</th>
        <th style="width: 8%;">Cant.</th>
        <th>Descripción</th>
        <th style="width: 13%;">Precio Unitario</th>
        <th style="width: 11%;">Descuento</th>
        <th style="width: 13%;">Precio Total</th>
      </tr>
    </thead>
    <tbody>
      ${detailsRows}
    </tbody>
  </table>

  <!-- Sección Inferior: Info Adicional + Formas de Pago y Cuadro de Totales -->
  <div class="bottom-grid">
    <div>
      <div class="box" style="margin-bottom: 8px;">
        <div style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 5px;">Información Adicional</div>
        ${inv.customer_email ? `<div><b>Email:</b> ${esc(inv.customer_email)}</div>` : ''}
        ${inv.customer_phone ? `<div><b>Teléfono:</b> ${esc(inv.customer_phone)}</div>` : ''}
        ${inv.notes ? `<div><b>Observaciones:</b> ${esc(inv.notes)}</div>` : ''}
      </div>

      <div class="box">
        <div style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 5px;">Forma de Pago</div>
        <table class="payments-table">
          <thead>
            <tr>
              <th>Forma de Pago</th>
              <th>Total</th>
              <th>Plazo</th>
              <th>Tiempo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${esc(PAYMENT_NAMES[inv.payment_method] || inv.payment_method || 'SIN SISTEMA FINANCIERO')}</td>
              <td style="text-align: right; font-family: monospace;">${formatNum(inv.total)}</td>
              <td style="text-align: center;">0</td>
              <td style="text-align: center;">Días</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Totales -->
    <div>
      <table class="totals-table box" style="margin: 0;">
        <tr>
          <td>SUBTOTAL 15%</td>
          <td>${formatNum(inv.subtotal_taxable)}</td>
        </tr>
        <tr>
          <td>SUBTOTAL 0%</td>
          <td>${formatNum(inv.subtotal_zero_tax)}</td>
        </tr>
        <tr>
          <td>SUBTOTAL NO OBJETO DE IVA</td>
          <td>0.00</td>
        </tr>
        <tr>
          <td>SUBTOTAL EXENTO DE IVA</td>
          <td>0.00</td>
        </tr>
        <tr>
          <td>SUBTOTAL SIN IMPUESTOS</td>
          <td>${formatNum(inv.subtotal)}</td>
        </tr>
        <tr>
          <td>TOTAL DESCUENTO</td>
          <td>${formatNum(inv.discount_total)}</td>
        </tr>
        <tr>
          <td>ICE</td>
          <td>0.00</td>
        </tr>
        <tr>
          <td>IVA 15%</td>
          <td>${formatNum(inv.tax_total)}</td>
        </tr>
        <tr>
          <td>PROPINA</td>
          <td>0.00</td>
        </tr>
        <tr class="grand-total">
          <td>VALOR TOTAL</td>
          <td>${formatNum(inv.total)}</td>
        </tr>
      </table>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  <\/script>
</body>
</html>`
}

/**
 * Genera el Ticket Térmico de 80mm para puntos de venta (POS)
 */
export function generateRideTicketHtml(inv: any, company: any, cashInfo?: { received?: number; change?: number }): string {
  const barcodeSvg = inv?.access_key ? generateBarcode128Svg(inv.access_key, { height: 35, barWidth: 0.9, showText: false }) : ''
  const isInvoice = (inv?.document_type || '01') === '01'
  const docTitle = isInvoice ? 'FACTURA ELECTRÓNICA' : 'NOTA DE CRÉDITO ELECTRÓNICA'

  const items = (inv.details || [])
    .map(
      (d: any) => `
      <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
        <span style="font-weight:600; flex: 1;">${esc(d.description)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; color:#444; font-size:10px; margin-bottom:4px;">
        <span>${esc(d.quantity)} x $${formatNum(d.unit_price)}${Number(d.discount) > 0 ? ` (-$${formatNum(d.discount)})` : ''}</span>
        <span style="font-weight:bold; color:#000;">$${formatNum(d.total)}</span>
      </div>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket ${esc(inv.invoice_number || inv.credit_note_number)}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      margin: 0;
      padding: 5px;
      width: 72mm;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-end { text-align: right; }
    .fw-bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .divider-double { border-top: 2px solid #000; margin: 6px 0; }
    .row-flex { display: flex; justify-content: space-between; margin: 2px 0; }
    .access-key { font-size: 9px; word-break: break-all; text-align: center; margin-top: 3px; }
    @media print {
      body { width: 100%; margin: 0; padding: 2px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Encabezado Emisor -->
  <div class="text-center">
    <div style="font-size: 13px; font-weight: bold;">${esc(company.trade_name || company.business_name || 'DESKOUNTA')}</div>
    <div style="font-size: 11px;">${esc(company.business_name || '')}</div>
    <div>R.U.C.: ${esc(company.ruc || '')}</div>
    <div>Dir: ${esc(inv.branch_address || company.address_matriz || 'Ecuador')}</div>
    ${company.obligated_accounting ? '<div>Obligado a llevar contabilidad: SI</div>' : ''}
    ${company.tax_regime === 'RIMPE_EMPRENDEDOR' ? '<div>CONTRIBUYENTE RÉGIMEN RIMPE</div>' : ''}
    ${company.tax_regime === 'RIMPE_NEGOCIO_POPULAR' ? '<div>CONTRIBUYENTE NEGOCIO POPULAR</div>' : ''}
  </div>

  <div class="divider"></div>

  <!-- Datos Comprobante -->
  <div class="text-center">
    <div class="fw-bold" style="font-size: 12px;">${docTitle}</div>
    <div class="fw-bold" style="font-size: 13px;">No: ${esc(inv.invoice_number || inv.credit_note_number)}</div>
    <div>Fecha: ${esc(inv.issue_date)}</div>
  </div>

  <div class="divider"></div>

  <!-- Datos Cliente -->
  <div>
    <div><b>Cliente:</b> ${esc(inv.customer_name)}</div>
    <div><b>RUC/CI:</b> ${esc(inv.customer_id_number)}</div>
    ${inv.customer_address ? `<div><b>Dir:</b> ${esc(inv.customer_address)}</div>` : ''}
  </div>

  <div class="divider-double"></div>

  <!-- Detalle Artículos -->
  <div>
    ${items}
  </div>

  <div class="divider"></div>

  <!-- Totales -->
  <div>
    <div class="row-flex"><span>Subtotal 15%:</span> <span>$${formatNum(inv.subtotal_taxable)}</span></div>
    <div class="row-flex"><span>Subtotal 0%:</span> <span>$${formatNum(inv.subtotal_zero_tax)}</span></div>
    ${Number(inv.discount_total) > 0 ? `<div class="row-flex"><span>Descuento:</span> <span>-$${formatNum(inv.discount_total)}</span></div>` : ''}
    <div class="row-flex"><span>IVA (15%):</span> <span>$${formatNum(inv.tax_total)}</span></div>
    <div class="divider"></div>
    <div class="row-flex" style="font-size: 14px; font-weight: bold;">
      <span>TOTAL:</span>
      <span>$${formatNum(inv.total)}</span>
    </div>
  </div>

  <!-- Pago y Vuelto -->
  <div class="divider"></div>
  <div>
    <div class="row-flex">
      <span>Forma de Pago:</span>
      <span style="font-weight: 600;">${esc(PAYMENT_NAMES[inv.payment_method] ? inv.payment_method === '01' ? 'EFECTIVO' : 'SISTEMA FINANC.' : 'EFECTIVO')}</span>
    </div>
    ${cashInfo && cashInfo.received != null && cashInfo.received > 0 ? `
    <div class="row-flex"><span>Efectivo Recibido:</span> <span>$${formatNum(cashInfo.received)}</span></div>
    <div class="row-flex" style="font-weight: bold;"><span>Cambio / Vuelto:</span> <span>$${formatNum(cashInfo.change)}</span></div>
    ` : ''}
  </div>

  <div class="divider"></div>

  <!-- Clave de Acceso SRI y Código de Barras -->
  <div class="text-center" style="margin-top: 6px;">
    <div style="font-size: 10px; font-weight: bold;">CLAVE DE ACCESO SRI</div>
    <div style="margin: 4px 0;">${barcodeSvg}</div>
    <div class="access-key">${esc(inv.access_key || '')}</div>
    <div style="margin-top: 4px; font-size: 9.5px;">Estado: <b>${esc(inv.sri_status || 'PENDIENTE')}</b></div>
  </div>

  <div class="divider"></div>

  <div class="text-center" style="font-size: 10px; margin-top: 8px;">
    ¡Gracias por su compra!<br>
    Consulte su comprobante en<br>
    <b>www.sri.gob.ec</b>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`
}

/**
 * Abre la ventana emergente y dispara la impresión del RIDE oficial (A4 o Ticket 80mm)
 */
export function printRideDoc(
  inv: any,
  company: any,
  format: 'a4' | 'ticket' = 'a4',
  cashInfo?: { received?: number; change?: number }
) {
  const html = format === 'ticket' ? generateRideTicketHtml(inv, company, cashInfo) : generateRideA4Html(inv, company)
  const printWindow = window.open('', '_blank', 'width=850,height=900')
  if (!printWindow) {
    alert('El navegador bloqueó la ventana de impresión. Por favor habilita los pop-ups.')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
}
