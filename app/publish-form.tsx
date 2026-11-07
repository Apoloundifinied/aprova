"use client";

import { useActionState, useState } from "react";
import { publishDelivery, type PublishResult } from "./actions";

export function PublishForm() {
  const [result, action, pending] = useActionState(publishDelivery, {} as PublishResult);
  const [copiedLink, setCopiedLink] = useState("");
  const reviewLink = result.link;

  async function copyLink() {
    if (!reviewLink) return;
    try {
      await navigator.clipboard.writeText(new URL(reviewLink, window.location.origin).href);
      setCopiedLink(reviewLink);
    } catch {
      setCopiedLink("");
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
    {result.error && <p role="alert">{result.error}</p>}
    {reviewLink && <div className="share">
      <p role="status">{copiedLink === reviewLink ? "Link copiado." : "V1 publicada. Compartilhe este link agora."}</p>
      <a href={reviewLink} target="_blank" rel="noreferrer">Abrir revisão</a>
      <button type="button" className="secondary" onClick={copyLink}>Copiar link</button>
    </div>}
  </section>;
}
