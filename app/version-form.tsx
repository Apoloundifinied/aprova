"use client";

import { useActionState } from "react";
import { publishVersion, type VersionResult } from "./actions";

export function VersionForm({ deliveryId }: { deliveryId: string }) {
  const [result, action, pending] = useActionState(
    publishVersion.bind(null, deliveryId), {} as VersionResult,
  );

  return <details className="version-upload">
    <summary>Enviar nova versão</summary>
    <form className="fields" action={action}>
      <label>Imagem da nova versão
        <input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
      </label>
      <button disabled={pending}>{pending ? "Publicando…" : "Publicar versão"}</button>
      {result.error && <p role="alert">{result.error}</p>}
      {result.number && <p role="status">V{result.number} publicada no mesmo link.</p>}
    </form>
  </details>;
}
