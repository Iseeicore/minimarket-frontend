import { getLocalISO, todayLocal } from './date'

describe('date helpers (timezone local)', () => {
  describe('getLocalISO', () => {
    it('devuelve formato YYYY-MM-DD', () => {
      const result = getLocalISO()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('usa componentes locales, no UTC', () => {
      // Crear una fecha que en UTC es día siguiente pero en local es hoy
      // 7 de abril 23:00 local → getDate()=7
      const d = new Date(2026, 3, 7, 23, 0, 0) // abril=3 (0-indexed)
      const result = getLocalISO(d)
      expect(result).toBe('2026-04-07')
    })

    it('nunca devuelve día siguiente por conversión UTC', () => {
      // El bug original: new Date().toISOString().slice(0,10)
      // Después de las 7 PM Lima, toISOString() da el día siguiente
      const d = new Date(2026, 3, 7, 20, 30, 0) // 8:30 PM local
      const localISO = getLocalISO(d)
      const utcISO = d.toISOString().slice(0, 10)

      // getLocalISO siempre da el día local correcto
      expect(localISO).toBe('2026-04-07')
      // toISOString PUEDE dar día siguiente (depende del timezone de la máquina de CI)
      // No podemos assertear el bug aquí porque depende de TZ del runner
    })

    it('maneja correctamente fin de mes', () => {
      const d = new Date(2026, 2, 31, 23, 59, 59) // 31 marzo 23:59
      expect(getLocalISO(d)).toBe('2026-03-31')
    })

    it('maneja correctamente fin de año', () => {
      const d = new Date(2026, 11, 31, 23, 59, 59) // 31 diciembre 23:59
      expect(getLocalISO(d)).toBe('2026-12-31')
    })

    it('pad con ceros en meses y días < 10', () => {
      const d = new Date(2026, 0, 5, 12, 0, 0) // 5 enero
      expect(getLocalISO(d)).toBe('2026-01-05')
    })
  })

  describe('todayLocal', () => {
    it('devuelve string YYYY-MM-DD', () => {
      expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('coincide con getLocalISO sin argumentos', () => {
      // Pueden diferir por 1ms en el cambio de medianoche, pero en la práctica no
      expect(todayLocal()).toBe(getLocalISO())
    })
  })
})
