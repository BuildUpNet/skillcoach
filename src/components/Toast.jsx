import { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,.45)] animate-[toast-in_.25s_ease-out] ${
              t.type === "error" ? "bg-crimson" : "bg-forest"
            }`}
          >
            <span className={`grid h-6 w-6 flex-none place-items-center rounded-full ${t.type === "error" ? "bg-white/20" : "bg-gold text-ink"}`}>
              {t.type === "error" ? "!" : "✓"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);