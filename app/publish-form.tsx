"use client";

import { useActionState } from "react";
import { publishDelivery, type PublishResult } from "./actions";

import { useActionNotice, useNotify } from "./notifications";

export function PublishForm() {
  const [result, action, pending] = useActionState(publishDelivery, {} as PublishResult);
  const notify = useNotify();
  useActionNotice(result, result.link ? "V1 publicada. O link está pronto para compartilhar." : undefined, result.error);
  const reviewLink = result.link;

  async function copyLink() {
    if (!reviewLink) return;
    try {
      await navigator.clipboard.writeText(new URL(reviewLink, window.location.origin).href);
      notify("Link copiado.");
    } catch {
      notify("Não foi possível copiar. Abra a revisão para copiar o endereço.", "error");
    }
  }

  return <section className="panel">
    <h2>Nova entrega</h2>
    <form className="fields" action={action}>
      <label>Título<input name="title" placeholder="Campanha de lançamento" required maxLength={100} /></label>
      <label>Arquivo da V1<input name="file" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
      <p className="muted">PNG, JPEG ou WebP de até 3 MB.</p>
      <button type="submit" disabled={pending}>{pending ? "Publicando…" : "Publicar V1"}</button>
    </form>
    {result.error && <p className="field-error">{result.error}</p>}
    {reviewLink && <div className="share">
      <a href={reviewLink} target="_blank" rel="noreferrer">Abrir revisão</a>
      <button type="button" className="secondary" onClick={copyLink}>Copiar link</button>
    </div>}
  </section>;
}
