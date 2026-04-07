import { useState, useCallback, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../store/auth.store'
import { cargaMasivaService, type CargaMasivaResult } from '../services/carga-masiva.service'
import { sileo } from 'sileo'

type SheetData = Record<string, string | number>[]

interface ParsedSheets {
  categorias: SheetData
  productos: SheetData
  variantes: SheetData
}

// -- Component ----------------------------------------------------------------

function CargaMasivaPage() {
  // -- Estado --
  const almacenId = useAuthStore((s) => s.usuario?.almacenId)
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<ParsedSheets | null>(null)
  const [activeTab, setActiveTab] = useState<keyof ParsedSheets>('categorias')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CargaMasivaResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // -- Handlers --
  const parseFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })

        const getSheet = (name: string): SheetData => {
          const ws = wb.Sheets[name]
          if (!ws) return []
          return XLSX.utils.sheet_to_json<Record<string, string | number>>(ws)
        }

        setSheets({
          categorias: getSheet('Categorias'),
          productos: getSheet('Productos'),
          variantes: getSheet('Variantes'),
        })
        setActiveTab('categorias')
      } catch {
        setError('No se pudo leer el archivo. Verificá que sea un .xlsx válido.')
        setSheets(null)
      }
    }
    reader.readAsArrayBuffer(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f && f.name.endsWith('.xlsx')) parseFile(f)
      else setError('Solo se aceptan archivos .xlsx')
    },
    [parseFile],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) parseFile(f)
    },
    [parseFile],
  )

  const handleUpload = async () => {
    if (!file || !almacenId) return
    setLoading(true)
    setError(null)
    try {
      const res = await cargaMasivaService.cargarCatalogo(file, almacenId)
      setResult(res)
      sileo.success('Catálogo cargado correctamente')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar el catálogo'
      setError(typeof msg === 'string' ? msg : msg.join(', '))
      sileo.error('Error en la carga masiva')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setSheets(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const tabs: { key: keyof ParsedSheets; label: string }[] = [
    { key: 'categorias', label: `Categorías (${sheets?.categorias.length ?? 0})` },
    { key: 'productos', label: `Productos (${sheets?.productos.length ?? 0})` },
    { key: 'variantes', label: `Variantes (${sheets?.variantes.length ?? 0})` },
  ]

  // -- JSX --
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Carga Masiva de Catálogo</h1>
        {file && !result && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-tin-dark hover:text-gray-900 transition-colors"
          >
            <X size={16} /> Limpiar
          </button>
        )}
      </div>

      {/* Resultado exitoso */}
      {result && (
        <div className="bg-white rounded-2xl border border-primary/30 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-primary-dark" size={28} />
            <h2 className="text-lg font-semibold text-gray-900">Carga completada</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Categorías', value: result.categorias },
              { label: 'Productos', value: result.productos },
              { label: 'Variantes', value: result.variantes },
              { label: 'Stock Almacén', value: result.stockAlmacen },
              { label: 'Stock Tienda', value: result.stockTienda },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-primary-pale/50 rounded-xl">
                <div className="text-2xl font-bold text-primary-dark">{item.value}</div>
                <div className="text-xs text-tin-dark mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={reset}
            className="mt-4 px-4 py-2 bg-primary text-gray-900 font-medium rounded-xl active:scale-95 transition-all duration-150"
          >
            Cargar otro archivo
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Zona de upload */}
      {!result && !sheets && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-4 p-12
            border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
            ${dragOver
              ? 'border-primary-dark bg-primary-pale/30'
              : 'border-tin/30 bg-white hover:border-primary hover:bg-primary-pale/10'
            }
          `}
        >
          <Upload className="text-tin" size={48} />
          <div className="text-center">
            <p className="text-gray-900 font-medium">
              Arrastrá tu archivo .xlsx acá
            </p>
            <p className="text-sm text-tin-dark mt-1">
              o hacé click para seleccionar
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Preview de hojas */}
      {sheets && !result && (
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
          {/* Archivo seleccionado */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-tin/10 bg-tin-pale/50">
            <FileSpreadsheet className="text-primary-dark" size={20} />
            <span className="text-sm font-medium text-gray-900">{file?.name}</span>
            <span className="text-xs text-tin-dark">
              ({((file?.size ?? 0) / 1024).toFixed(1)} KB)
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-tin/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 px-4 py-2.5 text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? 'text-primary-dark border-b-2 border-primary-dark bg-primary-pale/20'
                    : 'text-tin-dark hover:text-gray-900'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto max-h-96">
            <PreviewTable data={sheets[activeTab]} />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-tin/10 bg-tin-pale/30">
            <p className="text-xs text-tin-dark">
              {sheets.categorias.length} categorías · {sheets.productos.length} productos · {sheets.variantes.length} variantes
            </p>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="
                flex items-center gap-2 px-6 py-2.5
                bg-primary-dark text-white font-medium rounded-xl
                hover:bg-primary-dark/90 active:scale-95 transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                min-h-[2.75rem]
              "
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Cargar catálogo
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// -- Sub-components -----------------------------------------------------------

function PreviewTable({ data }: { data: SheetData }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-tin-dark text-sm">
        Esta hoja está vacía
      </div>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <table className="w-full text-sm">
      <thead className="bg-tin-pale/60 sticky top-0">
        <tr>
          <th className="px-4 py-2.5 text-left text-xs font-semibold text-tin-dark uppercase tracking-wider">
            #
          </th>
          {columns.map((col) => (
            <th
              key={col}
              className="px-4 py-2.5 text-left text-xs font-semibold text-tin-dark uppercase tracking-wider"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-tin/10">
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-tin-pale/30 transition-colors">
            <td className="px-4 py-2 text-tin-dark">{i + 1}</td>
            {columns.map((col) => (
              <td key={col} className="px-4 py-2 text-gray-900 whitespace-nowrap">
                {row[col] ?? ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CargaMasivaPage
