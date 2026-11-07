"use client";

import { useState, useTransition } from "react";
import { manageDelivery } from "./actions";
import { useNotify } from "./notifications";

export function DeliveryTools({ id, closed }: { id: string; closed: boolean }) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const notify = useNotify();

  function run(intent: string) {
    start(async () => {
      const result = await manageDelivery(id, intent);
      setError(result.error ?? "");
      if (result.error) notify(result.error, "error");
      if (result.message) notify(result.message);
      if (result.link) setLink(result.link);
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(link, window.location.origin).href);
      notify("Link copiado.");
    } catch {
      notify("Abra a revisão para copiar o endereço.", "error");
    }
  }

  return <details className="delivery-menu">
    <summary aria-label="Ações do link">⋯ <span>Ações do link</span></summary>
    <div className="delivery-menu-body">
      {link && !closed && <>
        <a className="text-action" href={link} target="_blank" rel="noreferrer">Abrir revisão</a>
        <button type="button" className="secondary" onClick={copy}>Copiar link</button>
      </>}
      {!link && !closed && <button type="button" className="secondary" disabled={pending} onClick={() => run("link")}>Exibir link</button>}
      <details className="delivery-confirmation">
        <summary>{closed ? "Reativar com novo link" : "Gerar outro link"}</summary>
        <p>O endereço anterior perde o acesso. O novo link vale por sete dias.</p>
        <button type="button" className="secondary" disabled={pending} onClick={() => run("renew")}>Gerar novo link</button>
      </details>
      {!closed && <details className="delivery-confirmation">
        <summary>Arquivar entrega</summary>
        <p>O histórico fica salvo em links encerrados e o acesso do cliente é revogado.</p>
        <button type="button" className="secondary destructive" disabled={pending} onClick={() => run("archive")}>Arquivar e revogar</button>
      </details>}
      {error && <p className="field-error">{error}</p>}
      {pending && <p role="status">Aguarde…</p>}
    </div>
  </details>;
}
