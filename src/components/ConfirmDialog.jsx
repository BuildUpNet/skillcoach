import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ConfirmCtx = createContext(() => Promise.resolve(false));

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, confirmText, danger }
  const resolver = useRef(null);

  const confirm = useCallback((opts) => {
    setState({ confirmText: "Confirm", danger: false, ...opts });
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => close(false)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,.4)] ring-1 ring-line animate-[toast-in_.2s_ease-out]"
          >
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl text-xl font-extrabold ${state.danger ? "bg-crimson/10 text-crimson" : "bg-gold-soft text-gold-deep"}`}>
              {state.danger ? "!" : "?"}
            </div>
            <h3 className="text-[20px] font-extrabold tracking-tight text-ink">{state.title}</h3>
            {state.message && <p className="mt-2 text-[15px] leading-6 text-ink/65">{state.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => close(false)} className="rounded-xl px-4 py-2.5 text-[15px] font-semibold text-ink/60 hover:bg-mist hover:text-ink">
                Cancel
              </button>
              <button
                autoFocus
                onClick={() => close(true)}
                className={`rounded-xl px-5 py-2.5 text-[15px] font-bold text-white ${state.danger ? "bg-crimson hover:bg-crimson/90" : "bg-forest hover:bg-forest-deep"}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);
