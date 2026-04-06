import { useState, useRef, useEffect } from 'react'
import { BookOpen, Send, Loader2, ChevronDown } from 'lucide-react'
import { useBitacora, useCreateEntrada } from '../hooks/useBitacora'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useAuthStore } from '../store/auth.store'
import EmptyState from '../components/shared/EmptyState'
import Pagination from '../components/shared/Pagination'

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BitacoraPage() {
  const [page, setPage]   = useState(1)
  const LIMIT             = 20

  const usuario  = useAuthStore(s => s.usuario)
  const isAdmin  = useAuthStore(s => s.isAdmin)

  // Admin elige almacén para registrar la entrada; almacenero usa el suyo
  const { data: almacenes = [] } = useAlmacenes()
  const [adminAlmacenId, setAdminAlmacenId] = useState<number | null>(null)
  const almacenId = isAdmin() ? adminAlmacenId : (usuario?.almacenId ?? null)

  // Filtrar por almacén también en la lista (admin puede ver todas o filtrar)
  const filtroAlmacenId = isAdmin() ? (adminAlmacenId ?? undefined) : (usuario?.almacenId ?? undefined)

  const { data: result, isLoading } = useBitacora(page, LIMIT, filtroAlmacenId)
  const entradas = result?.data ?? []
  const meta     = result?.meta

  const crear                              = useCreateEntrada()
  const [texto, setTexto]                 = useState('')
  const textareaRef                        = useRef<HTMLTextAreaElement>(null)
  const listaRef                           = useRef<HTMLDivElement>(null)

  // Auto-resize del textarea mientras el usuario escribe
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [texto])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t || !almacenId) return
    crear.mutate(
      { almacenId, contenido: t },
      {
        onSuccess: () => {
          setTexto('')
          listaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        },
      }
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <BookOpen size={22} className="text-tin-dark" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bitácora</h1>
          <p className="text-sm text-tin-dark mt-0.5">Registro de eventos del día. Append-only.</p>
        </div>
      </div>

      {/* ── Formulario nueva entrada ── */}
      <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-tin-dark uppercase tracking-wide">
              Nueva entrada
            </label>

            {/* Selector de almacén — solo visible para admin */}
            {isAdmin() && (
              <div className="relative">
                <select
                  value={adminAlmacenId ?? ''}
                  onChange={e => { setAdminAlmacenId(e.target.value ? Number(e.target.value) : null); setPage(1) }}
                  className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-tin/30 text-xs font-medium text-gray-700 bg-white hover:border-tin/60 focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  <option value="">Seleccioná almacén</option>
                  {almacenes.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAdmin() && !almacenId
                ? 'Seleccioná un almacén primero...'
                : 'Anotá lo que pasó hoy... (Ctrl+Enter para enviar)'
            }
            disabled={!almacenId}
            rows={3}
            className="w-full rounded-xl border border-tin/30 px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none overflow-hidden disabled:bg-tin-pale disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-tin">Ctrl+Enter para enviar rápido</p>
            <button
              type="submit"
              disabled={!texto.trim() || !almacenId || crear.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50 min-h-[2.75rem]"
            >
              {crear.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />
              }
              {crear.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Lista de entradas ── */}
      {entradas.length === 0 && !isLoading ? (
        <EmptyState message="Sin entradas en la bitácora. ¡Anotá el primer evento del día!" />
      ) : (
        <div ref={listaRef} className="space-y-3">
          {entradas.map((entrada, idx) => (
            <div
              key={entrada.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-200 ${
                idx === 0 ? 'border-primary/30' : 'border-tin/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 leading-relaxed flex-1 whitespace-pre-wrap">
                  {entrada.contenido}
                </p>
                {idx === 0 && (
                  <span className="shrink-0 bg-primary-pale text-primary-dark text-xs font-semibold px-2 py-0.5 rounded-full">
                    Reciente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-tin/10">
                <div className="w-5 h-5 rounded-full bg-tin-pale flex items-center justify-center">
                  <span className="text-xs text-tin-dark font-bold">
                    {(entrada.usuario?.nombre ?? 'U')[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-tin-dark">{entrada.usuario?.nombre ?? 'Usuario'}</span>
                {entrada.almacen && (
                  <span className="text-xs text-tin ml-1">· {entrada.almacen.nombre}</span>
                )}
                <span className="text-xs text-tin ml-auto">{formatFecha(entrada.registradoEn)}</span>
              </div>
            </div>
          ))}

          {meta && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={LIMIT}
              onPage={p => { setPage(p); listaRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          )}
        </div>
      )}
    </div>
  )
}
