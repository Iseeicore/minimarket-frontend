import { Bluetooth, BluetoothOff, Loader2, Printer, XCircle, Wifi, RefreshCw } from 'lucide-react'
import { usePrinterStore } from '../../store/printer.store'

export default function TiendaImpresora() {
  const printer = usePrinterStore()

  async function handleConnect() {
    try { await printer.connect() } catch { /* store notifica */ }
  }

  async function handleReconnect() {
    try {
      const ok = await printer.reconnect()
      if (!ok) {
        // Si falla reconexion, caer al flujo manual
        await printer.connect()
      }
    } catch { /* store notifica */ }
  }

  function handleDisconnect() {
    printer.disconnect()
  }

  async function handleTestPrint() {
    try { await printer.printTest() } catch { /* store notifica */ }
  }

  const connected  = printer.status === 'connected'
  const connecting = printer.status === 'connecting'
  const hasError   = printer.status === 'error'

  return (
    <div className="space-y-6 pt-2">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Printer size={20} className="text-accent-dark" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Impresora</h1>
          <p className="text-xs text-tin mt-0.5">Conecta y proba tu impresora termica</p>
        </div>
      </div>

      {/* Estado actual */}
      <div className={`rounded-2xl border p-5 space-y-3 ${
        connected ? 'bg-primary-pale/30 border-primary/30' :
        hasError  ? 'bg-red-50 border-red-200' :
                    'bg-white border-tin/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            connected ? 'bg-primary/20' :
            hasError  ? 'bg-red-100' :
            connecting ? 'bg-amber-100' :
                        'bg-tin-pale'
          }`}>
            {connected  && <Bluetooth size={24} className="text-primary-dark" />}
            {connecting && <Loader2 size={24} className="text-amber-500 animate-spin" />}
            {hasError   && <XCircle size={24} className="text-red-500" />}
            {!connected && !connecting && !hasError && <BluetoothOff size={24} className="text-tin" />}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">
              {connected  ? 'Conectada' :
               connecting ? 'Conectando...' :
               hasError   ? 'Error de conexion' :
                            'Desconectada'}
            </p>
            {connected && printer.deviceName && (
              <p className="text-sm text-tin-dark mt-0.5">
                <Wifi size={12} className="inline mr-1" />
                {printer.deviceName}
              </p>
            )}
            {connecting && printer.detail && (
              <p className="text-sm text-amber-600 mt-0.5">{printer.detail}</p>
            )}
            {!connected && !connecting && printer.hasSavedDevice && printer.deviceName && (
              <p className="text-sm text-tin mt-0.5">
                Ultima: <span className="font-medium text-slate-600">{printer.deviceName}</span>
              </p>
            )}
            {!connected && !connecting && !printer.hasSavedDevice && (
              <p className="text-sm text-tin mt-0.5">
                {printer.detail || 'Bluetooth no activo'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Soporte del navegador */}
      {!printer.isSupported && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
          <p className="text-sm font-bold text-amber-800">Navegador no compatible</p>
          <p className="text-xs text-amber-700">
            Web Bluetooth solo funciona en Chrome o Edge. Abrilo desde ahi.
          </p>
        </div>
      )}

      {/* Acciones */}
      <div className="space-y-3">
        {!connected ? (
          <>
            {/* Reconexion rapida — solo si hay dispositivo guardado */}
            {printer.hasSavedDevice && (
              <button
                onClick={handleReconnect}
                disabled={connecting || !printer.isSupported}
                className="w-full min-h-[3rem] flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 font-bold text-base rounded-2xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-40"
              >
                <RefreshCw size={18} />
                {connecting ? 'Reconectando...' : `Reconectar "${printer.deviceName}"`}
              </button>
            )}

            {/* Busqueda manual — secundario si hay dispositivo, primario si no */}
            <button
              onClick={handleConnect}
              disabled={connecting || !printer.isSupported}
              className={`w-full flex items-center justify-center gap-2 font-bold rounded-2xl active:scale-[0.98] transition-all duration-150 disabled:opacity-40 ${
                printer.hasSavedDevice
                  ? 'min-h-[2.75rem] bg-tin-pale hover:bg-slate-200 text-tin-dark text-sm'
                  : 'min-h-[3rem] bg-primary hover:bg-primary-dark text-slate-900 text-base shadow-md shadow-primary/20'
              }`}
            >
              <Bluetooth size={18} />
              {connecting && !printer.hasSavedDevice ? 'Buscando...' : 'Buscar nueva impresora'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleTestPrint}
              disabled={printer.isPrinting}
              className="w-full min-h-[3rem] flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 font-bold text-base rounded-2xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              <Printer size={18} />
              {printer.isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket de Prueba'}
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full min-h-[2.75rem] flex items-center justify-center gap-2 bg-tin-pale hover:bg-slate-200 text-tin-dark font-semibold text-sm rounded-2xl active:scale-[0.98] transition-all duration-150"
            >
              <BluetoothOff size={16} />
              Desconectar
            </button>
          </>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-white rounded-2xl border border-tin/20 p-5 space-y-3">
        <p className="text-sm font-bold text-slate-800">Como conectar</p>
        <ol className="text-sm text-tin-dark space-y-2 list-decimal list-inside">
          {printer.hasSavedDevice ? (
            <>
              <li>Encende la impresora termica</li>
              <li>Toca <span className="font-bold text-slate-700">Reconectar</span> — se conecta sin popup</li>
              <li>Si falla, usa <span className="font-bold text-slate-700">Buscar nueva impresora</span></li>
            </>
          ) : (
            <>
              <li>Encende la impresora termica</li>
              <li>Activa Bluetooth en tu dispositivo</li>
              <li>Toca <span className="font-bold text-slate-700">Buscar nueva impresora</span></li>
              <li>Selecciona tu impresora en el popup</li>
              <li>Ingresa el PIN si lo pide (generalmente 1234 o 0000)</li>
            </>
          )}
          <li>Toca <span className="font-bold text-slate-700">Imprimir Ticket de Prueba</span> para verificar</li>
        </ol>
      </div>

      {/* Info tecnica */}
      <div className="bg-tin-pale rounded-2xl p-4 space-y-1">
        <p className="text-xs font-bold text-tin-dark">Info tecnica</p>
        <p className="text-xs text-tin">Formato: ESC/POS 58mm (32 chars/linea)</p>
        <p className="text-xs text-tin">Conexion: Web Bluetooth (Chrome/Edge)</p>
        <p className="text-xs text-tin">Reconexion: getDevices() — sin popup en Chrome 85+</p>
        <p className="text-xs text-tin">Fallback: window.print() si no hay BT</p>
      </div>
    </div>
  )
}
