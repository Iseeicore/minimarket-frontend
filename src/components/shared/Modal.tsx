import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ open, title, onClose, children, size = 'md' }: Props) {
  if (!open) return null
  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full ${widths[size]} max-h-[92vh] sm:max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-tin/30" />
        </div>
        <div className="flex items-center justify-between px-4 pt-2 pb-3 sm:p-4 border-b border-tin/20">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-tin-pale transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
