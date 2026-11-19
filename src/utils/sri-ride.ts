/**
 * Generador e Impresor Oficial de RIDE SRI Ecuador y Ticket Térmico 80mm
 * Incluye generador de Código de Barras Code 128 SVG puro (sin dependencias externas).
 */
import { api } from '@/services/axios'

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

/** Datos del emisor que imprime el RIDE. Un campo sin dato queda vacío/undefined: nunca se rellena con un valor inventado. */
export interface RideIssuer {
  ruc: string
  business_name: string
  trade_name: string
  address_matriz: string
  /** undefined = dato desconocido (no se imprime la leyenda) */
  obligated_accounting?: boolean
  special_taxpayer: string
  tax_regime: string
  sri_environment: string
  logo_url: string | null
  branch_logo_url: string | null
}

/**
 * Normaliza los datos del emisor. Acepta la empresa tal como la devuelve el backend (GET /company/:id:
 * business_name, trade_name y los datos fiscales dentro de `fiscal`) y también el resumen de
 * localStorage.selectedCompany (razon_social, nombre_comercial), que no trae los datos fiscales.
 */
export function normalizeRideIssuer(raw: any): RideIssuer {
  const c = raw || {}
  const f = c.fiscal || {}
  const obligated = c.obligated_accounting ?? f.obligated_accounting
  return {
    ruc: String(c.ruc || ''),
    business_name: String(c.business_name || c.razon_social || ''),
    trade_name: String(c.trade_name || c.nombre_comercial || ''),
    address_matriz: String(c.address_matriz || f.address_matriz || ''),
    obligated_accounting: obligated === undefined || obligated === null ? undefined : Boolean(obligated),
    special_taxpayer: String(c.special_taxpayer || f.special_taxpayer || ''),
    tax_regime: String(c.tax_regime || f.tax_regime || ''),
    sri_environment: String(c.sri_environment || f.sri_environment || ''),
    logo_url: c.logo_url || f.logo_url || null,
    branch_logo_url: c.branch_logo_url || null,
  }
}

/**
 * Obtiene del backend los datos reales del emisor (razón social, dirección matriz, obligado a llevar
 * contabilidad, régimen, ambiente). El resumen guardado en localStorage no los incluye.
 */
export async function fetchRideIssuer(companyId: number): Promise<RideIssuer> {
  const { data } = await api.get(`/company/${companyId}`)
  if (!data) throw new Error('No se pudieron obtener los datos de la empresa emisora.')
  return normalizeRideIssuer(data)
}

/** Tipo de comprobante (01 factura, 04 nota de crédito): dato explícito, número de NC o posiciones 9-10 de la clave de acceso. */
const resolveDocumentType = (inv: any): string => {
  if (inv?.document_type) return String(inv.document_type)
  if (inv?.credit_note_number) return '04'
  const key = String(inv?.access_key || '')
  if (/^\d{49}$/.test(key)) return key.slice(8, 10)
  return '01'
}

/**
 * Ambiente del comprobante (1 pruebas, 2 producción). Se toma de la clave de acceso del propio documento
 * (posición 24), que es lo que realmente se emitió; si no hay clave válida, de la empresa. '' = desconocido.
 */
const resolveEnvironment = (inv: any, issuer: RideIssuer): string => {
  const key = String(inv?.access_key || '')
  if (/^\d{49}$/.test(key)) return key.charAt(23)
  return String(inv?.sri_environment || issuer.sri_environment || '')
}

const environmentLabel = (env: string): string => (env === '2' ? 'PRODUCCIÓN' : env === '1' ? 'PRUEBAS' : '')

const rateLabel = (rate: number): string => String(Number(rate.toFixed(2)))

/**
 * Bases imponibles e IVA agrupados por la tarifa real de cada línea (15 %, 5 %, 0 %...).
 * Sin detalle no se puede saber la tarifa: se devuelve `known: false` y se imprime sin porcentaje.
 */
const taxBreakdown = (inv: any): { known: boolean; taxed: { rate: number; base: number; tax: number }[]; zeroBase: number } => {
  const details: any[] = Array.isArray(inv?.details) ? inv.details : []
  if (details.length === 0) {
    return { known: false, taxed: [], zeroBase: Number(inv?.subtotal_zero_tax || 0) }
  }
  const byRate = new Map<number, { base: number; tax: number }>()
  for (const d of details) {
    const rate = Number(d.tax_rate ?? 0)
    const cur = byRate.get(rate) || { base: 0, tax: 0 }
    cur.base += Number(d.subtotal || 0)
    cur.tax += Number(d.tax_value || 0)
    byRate.set(rate, cur)
  }
  const taxed = [...byRate.entries()]
    .filter(([rate]) => rate > 0)
    .sort((a, b) => b[0] - a[0])
    .map(([rate, t]) => ({ rate, base: t.base, tax: t.tax }))
  return { known: true, taxed, zeroBase: byRate.get(0)?.base || 0 }
}

/**
 * Genera el documento HTML oficial RIDE (A4) según la normativa del SRI Ecuador
 */
export function generateRideA4Html(inv: any, companyData: any): string {
  const company = normalizeRideIssuer(companyData)
  const environment = environmentLabel(resolveEnvironment(inv, company))
  const barcodeSvg = inv?.access_key ? generateBarcode128Svg(inv.access_key, { height: 40, showText: false }) : ''
  const isInvoice = resolveDocumentType(inv) === '01'
  const docTitle = isInvoice ? 'FACTURA' : 'NOTA DE CRÉDITO'
  const printLogoUrl = inv?.logo_url || inv?.branch_logo_url || company.branch_logo_url || company.logo_url || null
  const taxes = taxBreakdown(inv)
  const subtotalTaxedRows = taxes.known
    ? taxes.taxed.map((t) => `<tr>
          <td>SUBTOTAL ${rateLabel(t.rate)}%</td>
          <td>${formatNum(t.base)}</td>
        </tr>`).join('')
    : `<tr>
          <td>SUBTOTAL GRAVADO</td>
          <td>${formatNum(inv.subtotal_taxable)}</td>
        </tr>`
  const ivaRows = taxes.known
    ? taxes.taxed.map((t) => `<tr>
          <td>IVA ${rateLabel(t.rate)}%</td>
          <td>${formatNum(t.tax)}</td>
        </tr>`).join('')
    : `<tr>
          <td>IVA</td>
          <td>${formatNum(inv.tax_total)}</td>
        </tr>`

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
    <div class="box" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        ${printLogoUrl ? `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <img id="ride-logo-img" src="${esc(printLogoUrl)}" alt="Logo" crossorigin="anonymous" referrerpolicy="no-referrer" style="max-height: 55px; max-width: 125px; object-fit: contain; border-radius: 4px;" />
          <div style="flex: 1; min-width: 0;">
            <div class="company-title">${esc(company.business_name)}</div>
            <div class="company-trade">${esc(company.trade_name)}</div>
          </div>
        </div>
        ` : `
        <div class="company-title">${esc(company.business_name)}</div>
        <div class="company-trade">${esc(company.trade_name)}</div>
        `}
        <div style="margin-top: 6px; line-height: 1.4;">
          <b>Dirección Matriz:</b> ${esc(company.address_matriz)}<br>
          <b>Dirección Sucursal:</b> ${esc(inv.branch_address || company.address_matriz)}<br>
          ${company.special_taxpayer ? `<b>Contribuyente Especial Nro:</b> ${esc(company.special_taxpayer)}<br>` : ''}
          ${company.obligated_accounting === undefined ? '' : `<b>OBLIGADO A LLEVAR CONTABILIDAD:</b> ${company.obligated_accounting ? 'SI' : 'NO'}<br>`}
          ${company.tax_regime === 'RIMPE_EMPRENDEDOR' ? '<b>CONTRIBUYENTE RÉGIMEN RIMPE</b><br>' : ''}
          ${company.tax_regime === 'RIMPE_NEGOCIO_POPULAR' ? '<b>CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE</b><br>' : ''}
        </div>
      </div>
    </div>

    <!-- RUC y Autorización SRI -->
    <div class="box">
      <div class="ruc-box-title">R.U.C.: ${esc(company.ruc)}</div>
      <div class="doc-type-title">${docTitle}</div>
      <div class="doc-number">No. ${esc(inv.invoice_number || inv.credit_note_number || '')}</div>
      <div style="line-height: 1.35; margin-bottom: 4px;">
        <b>NÚMERO DE AUTORIZACIÓN:</b><br>
        <span style="font-family: monospace; font-size: 10.5px;">${esc(inv.sri_authorization_number || inv.access_key || 'PENDIENTE')}</span><br>
        <b>FECHA Y HORA DE AUTORIZACIÓN:</b> ${esc(inv.sri_authorization_date ? new Date(inv.sri_authorization_date).toLocaleString('es-EC') : 'NO AUTORIZADO')}<br>
        <b>AMBIENTE:</b> ${environment}<br>
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
        ${subtotalTaxedRows}
        <tr>
          <td>SUBTOTAL 0%</td>
          <td>${formatNum(taxes.known ? taxes.zeroBase : inv.subtotal_zero_tax)}</td>
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
        ${ivaRows}
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
</body>
</html>`
}

/**
 * Genera el Ticket Térmico de 80mm para puntos de venta (POS)
 */
export function generateRideTicketHtml(inv: any, companyData: any, cashInfo?: { received?: number; change?: number }): string {
  const company = normalizeRideIssuer(companyData)
  const barcodeSvg = inv?.access_key ? generateBarcode128Svg(inv.access_key, { height: 35, barWidth: 0.9, showText: false }) : ''
  const isInvoice = resolveDocumentType(inv) === '01'
  const docTitle = isInvoice ? 'FACTURA ELECTRÓNICA' : 'NOTA DE CRÉDITO ELECTRÓNICA'
  const printLogoUrl = inv?.logo_url || inv?.branch_logo_url || company.branch_logo_url || company.logo_url || null
  const taxes = taxBreakdown(inv)
  const subtotalTaxedRows = taxes.known
    ? taxes.taxed.map((t) => `<div class="row-flex"><span>Subtotal ${rateLabel(t.rate)}%:</span> <span>$${formatNum(t.base)}</span></div>`).join('')
    : `<div class="row-flex"><span>Subtotal gravado:</span> <span>$${formatNum(inv.subtotal_taxable)}</span></div>`
  const ivaRows = taxes.known
    ? taxes.taxed.map((t) => `<div class="row-flex"><span>IVA (${rateLabel(t.rate)}%):</span> <span>$${formatNum(t.tax)}</span></div>`).join('')
    : `<div class="row-flex"><span>IVA:</span> <span>$${formatNum(inv.tax_total)}</span></div>`

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
    ${printLogoUrl ? `<div style="margin-bottom: 6px;"><img id="ride-ticket-logo-img" src="${esc(printLogoUrl)}" alt="Logo" crossorigin="anonymous" referrerpolicy="no-referrer" style="max-height: 48px; max-width: 140px; object-fit: contain; filter: grayscale(100%);" /></div>` : ''}
    <div style="font-size: 13px; font-weight: bold;">${esc(company.trade_name || company.business_name)}</div>
    <div style="font-size: 11px;">${esc(company.business_name)}</div>
    <div>R.U.C.: ${esc(company.ruc)}</div>
    <div>Dir: ${esc(inv.branch_address || company.address_matriz)}</div>
    ${company.obligated_accounting === undefined ? '' : `<div>Obligado a llevar contabilidad: ${company.obligated_accounting ? 'SI' : 'NO'}</div>`}
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
    ${subtotalTaxedRows}
    <div class="row-flex"><span>Subtotal 0%:</span> <span>$${formatNum(taxes.known ? taxes.zeroBase : inv.subtotal_zero_tax)}</span></div>
    ${Number(inv.discount_total) > 0 ? `<div class="row-flex"><span>Descuento:</span> <span>-$${formatNum(inv.discount_total)}</span></div>` : ''}
    ${ivaRows}
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
</body>
</html>`
}

/**
 * Dispara la impresión del RIDE oficial (A4 o Ticket 80mm) en la misma pestaña
 * mediante un iframe invisible, sin abrir ventanas emergentes ni URLs 'about:blank'.
 */
export function printRideDoc(
  inv: any,
  company: any,
  format: 'a4' | 'ticket' = 'a4',
  cashInfo?: { received?: number; change?: number }
) {
  const html = format === 'ticket' ? generateRideTicketHtml(inv, company, cashInfo) : generateRideA4Html(inv, company)

  // Remover iframe previo si existe para asegurar estado limpio
  const oldIframe = document.getElementById('print-ride-iframe')
  if (oldIframe) {
    oldIframe.remove()
  }

  // Crear iframe invisible en la misma pestaña
  const iframe = document.createElement('iframe')
  iframe.id = 'print-ride-iframe'
  iframe.style.position = 'fixed'
  iframe.style.top = '0'
  iframe.style.left = '0'
  iframe.style.width = '1px'
  iframe.style.height = '1px'
  iframe.style.opacity = '0.01'
  iframe.style.border = '0'
  iframe.style.pointerEvents = 'none'
  iframe.style.zIndex = '-9999'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document || iframe.contentDocument
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  const win = iframe.contentWindow
  if (!win) return

  let printed = false
  const doPrint = () => {
    if (printed) return
    printed = true
    setTimeout(() => {
      try {
        win.focus()
        win.print()
      } catch (err) {
        console.error('Error al imprimir desde iframe:', err)
      }
    }, 250)
  }

  // Esperar a que la imagen del logo cargue dentro del iframe antes de disparar la impresión
  const img = (doc.getElementById('ride-logo-img') || doc.getElementById('ride-ticket-logo-img')) as HTMLImageElement | null
  if (img) {
    if (img.complete && img.naturalWidth > 0) {
      doPrint()
    } else {
      img.onload = () => doPrint()
      img.onerror = () => doPrint()
      setTimeout(doPrint, 1500)
    }
  } else {
    if (doc.readyState === 'complete') {
      doPrint()
    } else {
      win.addEventListener('load', doPrint)
      setTimeout(doPrint, 600)
    }
  }
}
