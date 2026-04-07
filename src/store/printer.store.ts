// ── PrinterStore — Estado global de la impresora Bluetooth ───────────────────

import { create } from 'zustand'
import { sileo } from 'sileo'
import { printerService } from '../lib/printer.service'
import { buildTicketBytes, buildTestTicketBytes } from '../lib/ticket-builder'
import type { OrdenSalida } from '../types'

type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface PrinterState {
  status: PrinterStatus
  deviceName: string | null
  detail: string
  isSupported: boolean
  isPrinting: boolean
  hasSavedDevice: boolean

  connect: () => Promise<boolean>
  reconnect: () => Promise<boolean>
  disconnect: () => void
  printOrden: (orden: OrdenSalida) => Promise<void>
  printTest: () => Promise<void>
}

export const usePrinterStore = create<PrinterState>((set) => {
  // Suscribirse a cambios del servicio — incluye detalle de cada paso
  printerService.subscribe((status, deviceName, detail) => {
    set({ status, deviceName, detail: detail ?? '' })

    // Notificaciones sileo por cada cambio relevante
    if (status === 'connecting' && detail) {
      sileo.info(detail)
    }
  })

  const savedName = typeof localStorage !== 'undefined'
    ? localStorage.getItem('printer_name')
    : null

  return {
    status: 'disconnected',
    deviceName: savedName,
    detail: '',
    isSupported: printerService.isSupported,
    isPrinting: false,
    hasSavedDevice: printerService.hasSavedDevice,

    async connect() {
      try {
        const ok = await printerService.connect()
        if (ok) {
          set({ hasSavedDevice: true })
          sileo.success(`Impresora "${printerService.deviceName}" conectada`)
        }
        return ok
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        sileo.error(`Error al conectar: ${msg}`)
        return false
      }
    },

    async reconnect() {
      try {
        const ok = await printerService.reconnect()
        if (ok) {
          sileo.success(`Reconectada: "${printerService.deviceName}"`)
        }
        return ok
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        sileo.error(`Error al reconectar: ${msg}`)
        return false
      }
    },

    disconnect() {
      printerService.disconnect()
      set({ hasSavedDevice: false })
      sileo.info('Impresora desconectada')
    },

    async printOrden(orden: OrdenSalida) {
      if (!printerService.isConnected) {
        sileo.warning('Conecta la impresora primero (desde el boton Bluetooth)')
        return
      }
      set({ isPrinting: true })
      try {
        sileo.info('Enviando ticket a la impresora...')
        const bytes = buildTicketBytes(orden)
        await printerService.print(bytes)
        sileo.success('Ticket impreso correctamente')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        sileo.error(`Error al imprimir: ${msg}`)
        throw err
      } finally {
        set({ isPrinting: false })
      }
    },

    async printTest() {
      if (!printerService.isConnected) {
        sileo.warning('Conecta la impresora primero')
        throw new Error('Impresora no conectada')
      }
      set({ isPrinting: true })
      try {
        sileo.info('Enviando ticket de prueba...')
        const bytes = buildTestTicketBytes()
        await printerService.print(bytes)
        sileo.success('Ticket de prueba impreso')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        sileo.error(`Error en prueba: ${msg}`)
        throw err
      } finally {
        set({ isPrinting: false })
      }
    },
  }
})
