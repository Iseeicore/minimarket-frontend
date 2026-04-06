import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, PackageSearch } from 'lucide-react'
import type { PendienteTienda } from '../../types'

interface Props {
  items: PendienteTienda[]
}

export function PanelPendientes({ items }: Props) {
  const [abierto, setAbierto] = useState(true)

  if (items.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm">
      {/* Cabecera */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors duration-150"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-amber-900 text-sm leading-tight">
            {items.length === 1
              ? '1 producto sin anotar en tu cuaderno'
              : `${items.length} productos sin anotar en tu cuaderno`}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            El almacén registró salidas que faltan en tu cuaderno
          </p>
        </div>
        <span className="shrink-0 text-amber-600">
          {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Lista colapsable */}
      {abierto && (
        <div className="bg-white divide-y divide-amber-100">
          {items.map(item => (
            <div key={item.varianteId} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <PackageSearch size={14} className="text-amber-600" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                </p>
                {item.variante?.producto && (
                  <p className="text-xs text-slate-400 truncate">{item.variante.producto.nombre}</p>
                )}
              </div>

              {/* Almacén / Tuyo / Falta */}
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">Almacén</p>
                  <p className="text-sm font-bold text-slate-600 tabular-nums">{item.cantidadAlmacen}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">Tuyo</p>
                  <p className="text-sm font-bold text-slate-600 tabular-nums">{item.cantidadTienda}</p>
                </div>
                <div className="text-center min-w-[2.5rem]">
                  <p className="text-[10px] text-amber-600 font-bold leading-none mb-0.5">Falta</p>
                  <p className="text-sm font-black text-amber-700 tabular-nums">{item.pendiente}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="px-4 py-2.5 bg-amber-50/60">
            <p className="text-xs text-amber-700 text-center italic">
              Anotá los que faltan usando el botón + de abajo
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
