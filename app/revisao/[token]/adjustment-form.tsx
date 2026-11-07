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
  imageReady: boolean;
};

export function ReviewActions({ token, versionId, versionNumber, approved, feedback, imageReady }: Props) {
  const [adjustment, adjust, adjusting] = useActionState(
    requestAdjustment.bind(null, token, versionId), {} as AdjustmentState,
  );
  const [approval, approve, approving] = useActionState(
    approveVersion.bind(null, token, versionId), {} as AdjustmentState,
  );
  useActionNotice(adjustment, adjustment.message, adjustment.error);
  useActionNotice(approval, approval.message ? `V${versionNumber} aprovada.` : undefined, approval.error);
  const pending = adjusting || approving;
  const disabled = pending || !imageReady;

  if (approved || approval.message) return <p className="version review-result" role="status">V{versionNumber} aprovada.</p>;
  if (feedback) return <details className="feedback review-result">
    <summary>Ajuste solicitado</summary>
    <p>{feedback}</p>
  </details>;
  if (adjustment.message) return <p className="muted review-result" role="status">Ajuste solicitado.</p>;

  return <>
    <form className="adjustment" action={approve}>
      <button type="submit" disabled={disabled}>{approving ? "Aprovando…" : "Aprovar versão"}</button>
      {approval.error && <p className="field-error">{approval.error}</p>}
    </form>
    <form className="fields adjustment" action={adjust}>
      <label>O que precisa mudar?
        <textarea name="comment" rows={4} maxLength={1000} required disabled={disabled} />
      </label>
      <button type="submit" className="secondary" disabled={disabled}>{adjusting ? "Enviando…" : "Pedir ajuste"}</button>
      {adjustment.error && <p className="field-error">{adjustment.error}</p>}
    </form>
  </>;
}
