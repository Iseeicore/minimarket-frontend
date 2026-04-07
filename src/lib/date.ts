/**
 * Helpers de fecha LOCAL — usan el timezone del navegador (Lima).
 *
 * NUNCA usar `new Date().toISOString().slice(0, 10)` para obtener "hoy"
 * porque .toISOString() convierte a UTC. Después de las 7 PM Lima,
 * daría el día siguiente.
 */

/** Fecha local como YYYY-MM-DD — seguro para cualquier hora del día */
export function getLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "Hoy" en timezone local como YYYY-MM-DD */
export function todayLocal(): string {
  return getLocalISO()
}
