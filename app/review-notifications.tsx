"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNotify } from "./notifications";

type ReviewEvent = { id: string; message: string };

export function ReviewNotifications({ events }: { events: ReviewEvent[] }) {
  const router = useRouter();
  const notify = useNotify();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(events.map(event => event.id));
      return;
    }
    for (const event of events) {
      if (!seen.current.has(event.id)) notify(event.message);
      seen.current.add(event.id);
    }
  }, [events, notify]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [router]);

  return null;
}
