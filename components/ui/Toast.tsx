"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

const ToastContext = createContext<(text: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(text);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-toast-up rounded-full bg-ink px-5 py-3 text-[13.5px] font-semibold text-bg shadow-sheet md:bottom-10"
        >
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
}
