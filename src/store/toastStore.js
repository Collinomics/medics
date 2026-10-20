import { create } from 'zustand'

let nextId = 1

const useToastStore = create((set) => ({
  toasts: [],
  add: (toast) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }))
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      toast.duration ?? 3500
    )
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export default useToastStore

export function useToast() {
  const add = useToastStore((s) => s.add)
  return {
    success: (message) => add({ type: 'success', message }),
    error:   (message) => add({ type: 'error',   message }),
    info:    (message) => add({ type: 'info',     message }),
  }
}
