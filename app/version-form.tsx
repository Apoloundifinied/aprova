"use client";

import { useActionState } from "react";
import { publishVersion, type VersionResult } from "./actions";

import { useActionNotice } from "./notifications";

export function VersionForm({ deliveryId }: { deliveryId: string }) {
  const [result, action, pending] = useActionState(
    publishVersion.bind(null, deliveryId), {} as VersionResult,
  );

  useActionNotice(result, result.number ? `V${result.number} publicada no mesmo link.` : undefined, result.error);

  return <details className="version-upload">
    <summary>Enviar nova versão</summary>
    <form className="fields" action={action}>
      <label>Imagem da nova versão
        <input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
      </label>
      <button className="secondary" disabled={pending}>{pending ? "Publicando…" : "Publicar versão"}</button>
      {result.error && <p className="field-error">{result.error}</p>}
    </form>
  </details>;
}
