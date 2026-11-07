"use client";

import { useActionState } from "react";
import { useActionNotice } from "../../notifications";
import { approveVersion, requestAdjustment, type AdjustmentState } from "./adjustment-action";

type Props = {
  token: string;
  versionId: string;
  versionNumber: number;
  approved: boolean;
  feedback?: string;
};

export function ReviewActions({ token, versionId, versionNumber, approved, feedback }: Props) {
  const [adjustment, adjust, adjusting] = useActionState(
    requestAdjustment.bind(null, token, versionId), {} as AdjustmentState,
  );
  const [approval, approve, approving] = useActionState(
    approveVersion.bind(null, token, versionId), {} as AdjustmentState,
  );
  useActionNotice(adjustment, adjustment.message, adjustment.error);
  useActionNotice(approval, approval.message ? `V${versionNumber} aprovada.` : undefined, approval.error);
  const pending = adjusting || approving;

  if (approved || approval.message) return <p className="version">V{versionNumber} aprovada.</p>;
  if (feedback) return <details className="feedback">
    <summary>Ajuste solicitado</summary>
    <p>{feedback}</p>
  </details>;
  if (adjustment.message) return <p className="muted">Ajuste solicitado.</p>;

  return <>
    <form className="adjustment" action={approve}>
      <button type="submit" disabled={pending}>{approving ? "Aprovando…" : "Aprovar versão"}</button>
      {approval.error && <p className="field-error">{approval.error}</p>}
    </form>
    <form className="fields adjustment" action={adjust}>
      <label>O que precisa mudar?
        <textarea name="comment" rows={4} maxLength={1000} required disabled={pending} />
      </label>
      <button type="submit" className="secondary" disabled={pending}>{adjusting ? "Enviando…" : "Pedir ajuste"}</button>
      {adjustment.error && <p className="field-error">{adjustment.error}</p>}
    </form>
  </>;
}
