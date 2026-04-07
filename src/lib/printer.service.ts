// ── PrinterService — Conexion Web Bluetooth con impresora termica ─────────────
// Descubre servicios y características dinámicamente — compatible con cualquier
// impresora térmica BLE (POS-5890U, MTP-II, Goojprt, etc.)

type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
type StatusListener = (status: PrinterStatus, deviceName: string | null, detail?: string) => void

// UUIDs conocidos de impresoras termicas — ordenados por probabilidad de ser el
// servicio CORRECTO de datos de impresión (no configuración).
// Obtenidos de chrome://bluetooth-internals con POS-5890U-L real
const KNOWN_SERVICES = [
  '0000ff00-0000-1000-8000-00805f9b34fb',  // Servicio de impresion genérico chino (MÁS COMÚN)
  '0000fff0-0000-1000-8000-00805f9b34fb',  // Alternativo de impresion chino
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',  // Goojprt, MTP-II
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',   // Microchip BLE UART
  '0000eee0-0000-1000-8000-00805f9b34fb',  // Servicio auxiliar
  '000018f0-0000-1000-8000-00805f9b34fb',  // Servicio genérico (puede ser config, probar último)
  '00001101-0000-1000-8000-00805f9b34fb',   // SPP emulado
]

const KNOWN_WRITE_CHARS = [
  '0000ff02-0000-1000-8000-00805f9b34fb',  // Write char para ff00 (MÁS COMÚN)
  '0000fff2-0000-1000-8000-00805f9b34fb',  // Write char para fff0
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',  // Write char para e7810a71
  '49535343-8841-43f4-a8d4-ecbe34729bb3',  // Write char para Microchip UART
  '0000eee1-0000-1000-8000-00805f9b34fb',  // Write char para eee0
  '00002af1-0000-1000-8000-00805f9b34fb',  // Genérico
]

class PrinterService {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private _status: PrinterStatus = 'disconnected'
  private _deviceName: string | null = null
  private _detail: string = ''
  private listeners: Set<StatusListener> = new Set()

  get status() { return this._status }
  get deviceName() { return this._deviceName }
  get detail() { return this._detail }
  get isConnected() { return this._status === 'connected' && this.characteristic !== null }

  subscribe(fn: StatusListener) {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private emit(status: PrinterStatus, name: string | null = this._deviceName, detail = '') {
    this._status = status
    this._deviceName = name
    this._detail = detail
    this.listeners.forEach(fn => fn(status, name, detail))
  }

  get isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  // ── Conectar — popup nativo del browser ──
  async connect(): Promise<boolean> {
    if (!this.isSupported) {
      this.emit('error', null, 'Web Bluetooth no soportado')
      throw new Error('Web Bluetooth no soportado en este navegador')
    }

    try {
      this.emit('connecting', null, 'Buscando dispositivo...')

      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_SERVICES,
      })

      if (!this.device) {
        this.emit('disconnected')
        return false
      }

      const name = this.device.name ?? 'Impresora BT'
      this.emit('connecting', name, 'Conectando GATT...')

      // Escuchar desconexion
      this.device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null
        this.emit('disconnected', null, 'Impresora desconectada')
      })

      const server = await this.device.gatt!.connect()
      this.emit('connecting', name, 'Buscando servicio de impresion...')

      // Buscar la característica de escritura
      this.characteristic = await this.findWritableCharacteristic(server, name)

      if (!this.characteristic) {
        this.device.gatt?.disconnect()
        this.emit('error', name, 'No se encontro servicio de impresion')
        throw new Error('No se encontro una característica de escritura en la impresora')
      }

      // Log para diagnóstico — qué servicio y característica se encontró
      console.log('[Printer] Conectada:', {
        device: name,
        service: this.characteristic.service.uuid,
        characteristic: this.characteristic.uuid,
        write: this.characteristic.properties.write,
        writeWithoutResponse: this.characteristic.properties.writeWithoutResponse,
      })

      localStorage.setItem('printer_name', name)
      this.emit('connected', name, 'Lista para imprimir')
      return true
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Error desconocido'
      const wasCancelled = msg.includes('cancelled') || msg.includes('canceled')
      if (wasCancelled) {
        this.emit('disconnected', null, 'Cancelado por el usuario')
        return false
      }
      this.emit('error', null, msg)
      throw err
    }
  }

  // ── Descubrir característica de escritura dinámicamente ──
  private async findWritableCharacteristic(
    server: BluetoothRemoteGATTServer,
    name: string,
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {

    // Estrategia 1: probar servicios conocidos primero (rápido)
    for (const svcUuid of KNOWN_SERVICES) {
      try {
        const service = await server.getPrimaryService(svcUuid)
        this.emit('connecting', name, `Servicio encontrado: ${svcUuid.slice(4, 8)}...`)

        // Buscar característica de escritura en este servicio
        const chars = await service.getCharacteristics()
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char
          }
        }

        // Probar UUIDs conocidos directamente
        for (const charUuid of KNOWN_WRITE_CHARS) {
          try {
            const char = await service.getCharacteristic(charUuid)
            if (char.properties.write || char.properties.writeWithoutResponse) {
              return char
            }
          } catch { /* no existe en este servicio, seguir */ }
        }
      } catch { /* servicio no disponible, probar siguiente */ }
    }

    // Estrategia 2: descubrir TODOS los servicios (lento pero exhaustivo)
    try {
      this.emit('connecting', name, 'Descubriendo todos los servicios...')
      const services = await server.getPrimaryServices()
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics()
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              return char
            }
          }
        } catch { /* siguiente servicio */ }
      }
    } catch { /* getPrimaryServices sin filtro puede fallar en algunos browsers */ }

    return null
  }

  // ── Desconectar ──
  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this.device = null
    this.characteristic = null
    localStorage.removeItem('printer_name')
    this.emit('disconnected', null)
  }

  // ── Escribir bytes ESC/POS en chunks ──
  // BLE tiene un MTU limitado (default 20 bytes). Impresoras chinas baratas
  // necesitan chunks pequeños + delay entre envíos para no desbordar el buffer.
  async print(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Impresora no conectada')
    }

    const CHUNK = 100  // Conservador para BLE — 512 desborda impresoras chinas
    const DELAY = 50   // ms entre chunks — da tiempo al buffer de la impresora

    // Preferir writeValue (CON respuesta) — más lento pero confiable.
    // writeWithoutResponse pierde datos en impresoras chinas baratas.
    const hasWrite = this.characteristic.properties.write
    const method = hasWrite ? 'writeValue' : 'writeValueWithoutResponse'

    console.log(`[Printer] Enviando ${data.length} bytes en chunks de ${CHUNK} via ${method}`)

    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK)
      if (hasWrite) {
        await this.characteristic.writeValue(chunk)
      } else {
        await this.characteristic.writeValueWithoutResponse(chunk)
      }
      // Delay entre chunks para que la impresora procese
      if (i + CHUNK < data.length) {
        await new Promise(r => setTimeout(r, DELAY))
      }
    }

    console.log('[Printer] Envío completado')
  }
}

export const printerService = new PrinterService()
