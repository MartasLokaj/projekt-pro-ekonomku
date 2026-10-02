import { useCallback, useEffect, useRef, useState } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
}

/** Imperative toast state: `show('Jedno vedle…')` → auto-hides after `duration` (or the given ms). */
export function useToast(duration = 1500) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  const show = useCallback(
    (text: string, ms: number = duration) => {
      window.clearTimeout(timer.current);
      counter.current += 1;
      setToast({ id: counter.current, text });
      timer.current = window.setTimeout(() => setToast(null), ms);
    },
    [duration],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, show };
}
