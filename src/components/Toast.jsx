import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import useToastStore from '@/store/toastStore'

const ICONS = {
  success: <CheckCircle size={16} className="text-green-500 shrink-0" />,
  error:   <XCircle    size={16} className="text-red-500   shrink-0" />,
  info:    <Info       size={16} className="text-blue-500  shrink-0" />,
}

const STYLES = {
  success: 'border-green-200 bg-white',
  error:   'border-red-200   bg-white',
  info:    'border-blue-200  bg-white',
}

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[260px] max-w-sm animate-slide-up ${STYLES[t.type]}`}
        >
          {ICONS[t.type]}
          <p className="text-sm text-gray-800 flex-1">{t.message}</p>
          <button
            onClick={() => remove(t.id)}
            className="text-gray-300 hover:text-gray-500 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
