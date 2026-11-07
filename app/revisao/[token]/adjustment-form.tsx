"use client";

import { useActionState } from "react";
import { requestAdjustment, type AdjustmentState } from "./adjustment-action";

export function AdjustmentForm({ token, versionId }: { token: string; versionId: string }) {
  const [result, action, pending] = useActionState(
    requestAdjustment.bind(null, token, versionId), {} as AdjustmentState,
  );

  if (result.message) return <p role="status">{result.message}</p>;

  return <form className="fields adjustment" action={action}>
    <label>O que precisa mudar?
      <textarea name="comment" rows={4} maxLength={1000} required disabled={pending} />
    </label>
    <button type="submit" className="secondary" disabled={pending}>
      {pending ? "Enviando…" : "Pedir ajuste"}
    </button>
    {result.error && <p role="alert">{result.error}</p>}
  </form>;
}
