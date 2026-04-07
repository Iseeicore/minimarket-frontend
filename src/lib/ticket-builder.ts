// ── TicketBuilder — Genera bytes ESC/POS para impresora 58mm ─────────────────
// Sin dependencias externas — comandos ESC/POS crudos.
// 58mm = 32 caracteres por linea (fuente normal)

import type { OrdenSalida } from '../types'

const LINE_WIDTH = 32

// ── Comandos ESC/POS ─────────────────────────────────────────────────────────
const ESC = 0x1B
const GS  = 0x1D
const LF  = 0x0A

const CMD = {
  INIT:         [ESC, 0x40],                // Inicializar impresora
  CODEPAGE:     [ESC, 0x74, 0x10],          // Seleccionar WPC1252 (page 16) — soporta español: áéíóúñü
  BOLD_ON:      [ESC, 0x45, 0x01],          // Negrita ON
  BOLD_OFF:     [ESC, 0x45, 0x00],          // Negrita OFF
  ALIGN_LEFT:   [ESC, 0x61, 0x00],          // Alinear izquierda
  ALIGN_CENTER: [ESC, 0x61, 0x01],          // Alinear centro
  ALIGN_RIGHT:  [ESC, 0x61, 0x02],          // Alinear derecha
  SIZE_NORMAL:  [GS, 0x21, 0x00],           // Tamaño normal
  SIZE_DOUBLE:  [GS, 0x21, 0x11],           // Doble alto y ancho
  CUT:          [GS, 0x56, 0x00],           // Corte total
  FEED_3:       [ESC, 0x64, 0x03],          // Avanzar 3 lineas
} as const

// ── Helpers ──────────────────────────────────────────────────────────────────

// Encoder CP1252 para español — NO usar TextEncoder (genera UTF-8, la impresora no lo entiende).
// CP1252: chars 0x00–0xFF mapean directo por charCode. Chars fuera de rango → '?'
function textBytes(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    // 0x00-0xFF cubre ASCII + Latin-1 supplement (áéíóúñüÑ¿¡ etc.)
    bytes.push(code <= 0xFF ? code : 0x3F) // 0x3F = '?'
  }
  return bytes
}

function line(text: string): number[] {
  return [...textBytes(text), LF]
}

function padLine(left: string, right: string): string {
  const spaces = Math.max(1, LINE_WIDTH - left.length - right.length)
  return left + ' '.repeat(spaces) + right
}

function separator(): number[] {
  return line('-'.repeat(LINE_WIDTH))
}

function doubleSep(): number[] {
  return line('='.repeat(LINE_WIDTH))
}

/** Trunca texto a N chars, agrega "." si se cortó */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '.'
}

/** Pad derecho: "abc" → "abc   " (ancho fijo) */
function rpad(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length)
}

/** Pad izquierdo: "5" → "  5" (ancho fijo) */
function lpad(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : ' '.repeat(width - text.length) + text
}

/**
 * Línea de item: CAN  P/U  DESCRIP.     TOTAL
 * Formato: 3 + 1 + 5 + 1 + 13 + 1 + 7 = 31 chars (cabe en 32)
 *
 * Ejemplo:
 *  10  1.00  Agua San L.    10.00
 *   5  6.00  Cerveza Cri    30.00
 */
function itemLine(cant: number, pu: number, desc: string, total: number): string {
  const sCant  = lpad(String(cant), 3)
  const sPU    = lpad(pu.toFixed(2), 5)
  const sDesc  = rpad(truncate(desc, 13), 13)
  const sTotal = lpad(total.toFixed(2), 7)
  return `${sCant} ${sPU} ${sDesc} ${sTotal}`
}

function money(n: number): string {
  return `S/ ${n.toFixed(2)}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

// ── Concatenador de bytes ────────────────────────────────────────────────────

function buildBytes(parts: number[][]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

// ── Builder principal ────────────────────────────────────────────────────────

export function buildTicketBytes(orden: OrdenSalida): Uint8Array {
  const parts: number[][] = []

  // Inicializar + codepage WPC1252 (español)
  parts.push([...CMD.INIT])
  parts.push([...CMD.CODEPAGE])

  // ══════ ENCABEZADO ══════
  parts.push([...CMD.ALIGN_CENTER])
  parts.push(doubleSep())
  parts.push([...CMD.BOLD_ON])
  parts.push(line('MINIMARKET'))
  parts.push([...CMD.BOLD_OFF])
  parts.push(line(orden.tipo === 'VENTA' ? '[VENTA]' : '[TRANSFERENCIA]'))
  parts.push(line(`ORDEN #${String(orden.numero).padStart(4, '0')}`))

  // ══════ META ══════
  parts.push([...CMD.ALIGN_LEFT])
  parts.push(separator())
  parts.push(line(`Fecha: ${fmtDate(orden.creadoEn)}  Hora: ${fmtTime(orden.creadoEn)}`))
  if (orden.solicitante?.nombre) {
    parts.push(line(`Solicito: ${orden.solicitante.nombre}`))
  }

  // ══════ TABLA DE ITEMS ══════
  parts.push(separator())
  parts.push([...CMD.BOLD_ON])
  //        CAN  P/U   DESCRIP.       TOTAL
  parts.push(line('CAN  P/U   DESCRIP.       TOTAL'))
  parts.push([...CMD.BOLD_OFF])
  parts.push(separator())

  let totalMonto = 0
  const detalles = orden.detalles
  for (let i = 0; i < detalles.length; i++) {
    const d = detalles[i]
    const prodNombre = d.variante?.producto?.nombre ?? ''
    const varNombre  = d.variante?.nombre ?? `#${d.varianteId}`
    const desc       = prodNombre ? `${prodNombre} ${varNombre}` : varNombre
    const precio     = parseFloat(d.variante?.precioVenta ?? '0')
    const subtotal   = precio * d.cantidad
    totalMonto += subtotal

    parts.push(line(itemLine(d.cantidad, precio, desc, subtotal)))

    if (d.origen === 'TIENDA') {
      parts.push(line('                   (tienda)'))
    }

    // Espacio entre items para anotaciones (linea vacia)
    if (i < detalles.length - 1) {
      parts.push(line(''))
    }
  }

  // ══════ TOTALES ══════
  parts.push(separator())
  parts.push(line(padLine(`ITEMS: ${orden.totalProductos}`, `CANT: ${orden.totalUnidades}`)))
  parts.push([...CMD.BOLD_ON])
  parts.push(line(padLine('TOTAL:', money(totalMonto))))
  parts.push([...CMD.BOLD_OFF])

  // ══════ PIE ══════
  parts.push(separator())
  parts.push([...CMD.ALIGN_CENTER])
  parts.push(line('GRACIAS POR SU COMPRA'))
  parts.push(doubleSep())

  // Feed + corte
  parts.push([...CMD.FEED_3])
  parts.push([...CMD.CUT])

  const result = buildBytes(parts)

  // Log del ticket para diagnóstico en consola
  const preview = parts
    .map(p => {
      if (p.length > 0 && (p[0] === ESC || p[0] === GS)) return null
      return String.fromCharCode(...p).replace(/\n/g, '')
    })
    .filter(Boolean)
    .join('\n')

  console.log(`[Ticket] Orden #${orden.numero} — ${result.length} bytes`)
  console.log(`[Ticket] Preview:\n${preview}`)

  return result
}

// ── Ticket de prueba ─────────────────────────────────────────────────────────

export function buildTestTicketBytes(): Uint8Array {
  const now = new Date().toISOString()
  const parts: number[][] = []

  parts.push([...CMD.INIT])
  parts.push([...CMD.CODEPAGE])

  // Encabezado
  parts.push([...CMD.ALIGN_CENTER])
  parts.push([...CMD.BOLD_ON])
  parts.push(line('MINIMARKET'))
  parts.push([...CMD.BOLD_OFF])
  parts.push(line('** TICKET DE PRUEBA **'))

  parts.push([...CMD.ALIGN_LEFT])
  parts.push(separator())
  parts.push(line(`Fecha: ${fmtDate(now)}`))
  parts.push(line(`Hora:  ${fmtTime(now)}`))
  parts.push(separator())

  // Items de prueba con caracteres especiales
  parts.push(line(padLine('Producto ejemplo', 'S/ 5.00')))
  parts.push(line(padLine('  2 x S/ 2.50', 'S/ 5.00')))
  parts.push(separator())

  // Test de caracteres especiales español
  parts.push([...CMD.BOLD_ON])
  parts.push(line('Test caracteres:'))
  parts.push([...CMD.BOLD_OFF])
  parts.push(line('Vocales: a e i o u'))
  parts.push(line('Tildes:  \u00e1 \u00e9 \u00ed \u00f3 \u00fa'))
  parts.push(line('Enie:    \u00f1 \u00d1'))
  parts.push(line('Otros:   \u00fc \u00bf \u00a1'))
  parts.push(separator())

  parts.push([...CMD.BOLD_ON])
  parts.push(line(padLine('TOTAL:', 'S/ 5.00')))
  parts.push([...CMD.BOLD_OFF])
  parts.push(separator())
  parts.push([...CMD.ALIGN_CENTER])
  parts.push(line('Impresora conectada OK'))
  parts.push([...CMD.FEED_3])
  parts.push([...CMD.CUT])

  return buildBytes(parts)
}
