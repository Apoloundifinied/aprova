"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Kind = "success" | "error";
type Notice = { id: number; message: string; kind: Kind };
const Notify = createContext<(message: string, kind?: Kind) => void>(() => {});

export function Notifications({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const sequence = useRef(0);
  const notify = useCallback((message: string, kind: Kind = "success") => {
    const id = ++sequence.current;
    setNotices(items => [...items.slice(-2), { id, message, kind }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setNotices(items => items.filter(item => item.id !== id));
  }, []);

  return <Notify.Provider value={notify}>
    {children}
    <div className="notice-stack" aria-label="Notificações">
      {notices.map(notice => <NoticeCard key={notice.id} notice={notice} dismiss={dismiss} />)}
    </div>
  </Notify.Provider>;
}

function NoticeCard({ notice, dismiss }: { notice: Notice; dismiss: (id: number) => void }) {
  useEffect(() => {
    if (notice.kind === "error") return;
    const timer = window.setTimeout(() => dismiss(notice.id), 5000);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);

  return <div className="notice" data-kind={notice.kind}>
    <span className="notice-icon" aria-hidden="true">{notice.kind === "success" ? "✓" : "!"}</span>
    <span role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</span>
    <button type="button" onClick={() => dismiss(notice.id)} aria-label="Fechar notificação">×</button>
  </div>;
}

export function useNotify() {
  return useContext(Notify);
}

export function useActionNotice(result: object, message?: string, error?: string) {
  const notify = useNotify();
  const previous = useRef<object | null>(null);
  useEffect(() => {
    if (previous.current === result) return;
    previous.current = result;
    if (error) notify(error, "error");
    else if (message) notify(message);
  }, [result, message, error, notify]);
}
