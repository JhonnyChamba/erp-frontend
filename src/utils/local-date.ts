/**
 * Fechas en la zona horaria del navegador (no en UTC).
 * `new Date().toISOString().slice(0, 10)` devuelve la fecha UTC: en Ecuador (UTC-5) desde las 19:00
 * ya es el día siguiente, y esa fecha termina en la clave de acceso del comprobante.
 */
export const toLocalISODate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Fecha de hoy (YYYY-MM-DD) según el reloj local del equipo. */
export const todayLocalISO = (): string => toLocalISODate(new Date())
