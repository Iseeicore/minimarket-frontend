import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page:       number
  totalPages: number
  total:      number
  limit:      number
  onPage:     (page: number) => void
}

export default function Pagination({ page, totalPages, total, limit, onPage }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  // Ventana de páginas: máximo 5 botones centrados en la actual
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      {/* Contador */}
      <p className="text-xs text-tin-dark order-2 sm:order-1">
        Mostrando <span className="font-medium text-slate-700">{from}–{to}</span> de{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>

      {/* Controles */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-tin-dark hover:bg-tin-pale disabled:opacity-30
            disabled:cursor-not-allowed transition-colors duration-150"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-tin">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                p === page
                  ? 'bg-primary text-slate-900'
                  : 'text-tin-dark hover:bg-tin-pale'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-tin-dark hover:bg-tin-pale disabled:opacity-30
            disabled:cursor-not-allowed transition-colors duration-150"
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
