import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = {
  success: 'border-emerald-500 text-emerald-700 dark:text-emerald-300',
  error: 'border-red-500 text-red-700 dark:text-red-300',
  info: 'border-sky-500 text-sky-700 dark:text-sky-300',
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((s) => s.filter((t) => t.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, type, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);
  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 bg-white p-3.5 shadow-lg dark:bg-navy-900 ${COLORS[t.type]}`}>
              <Icon size={20} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm text-slate-800 dark:text-slate-100">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
