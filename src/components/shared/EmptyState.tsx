import { PackageOpen } from 'lucide-react'

interface Props {
  message?: string
  action?: React.ReactNode
}

export default function EmptyState({ message = 'No hay datos', action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <PackageOpen size={40} className="mb-3" />
      <p className="text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
