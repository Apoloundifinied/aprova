"use client";
import Link from "next/link";
import { useState } from "react";
import { useNotify } from "../notifications";

export default function Demo() {
  const [step, setStep] = useState(0);
  const notify = useNotify();
  const stages = ["Em revisão", "Ajuste solicitado", "V2 em revisão", "Aprovada"];
  function advance() {
    setStep(value => value + 1);
    notify(["Pedido de ajuste enviado.", "V2 publicada no mesmo link.", "V2 aprovada. Entrega concluída."][step]);
  }
  return <main>
    <div className="heading dashboard-heading"><div>
      <p className="eyebrow">Demo interativa · dados fictícios</p>
      <h1>Da primeira versão à aprovação.</h1>
      <p className="muted">Experimente os dois papéis. Esta simulação não envia arquivos nem grava dados.</p>
    </div><Link className="text-action" href="/conheca">Sobre o Aprova</Link></div>
    <div className="columns review">
      <section className="preview demo-art" aria-label="Arte fictícia para revisão">
        <span className="eyebrow">Estúdio Aurora · campanha conceitual</span>
        <h2 key={step >= 2 ? "v2" : "v1"} className="review-result">Ideias claras.<br /><span>Novos começos.</span></h2>
        <p>{step >= 2 ? "Um novo olhar para o que vem a seguir." : "Um novo olhar."}</p>
        <span className="delivery-badge">V{step >= 2 ? 2 : 1}</span>
      </section>
      <aside className="panel review-side">
        <p className="eyebrow">{step === 1 ? "Visão do freelancer" : "Visão do cliente"}</p>
        <h2>Campanha Aurora</h2>
        <p role="status" className="version">{stages[step]}</p>
        <div key={step} className="review-result fields">
          <p className="muted">{[
            "Você recebeu a primeira versão. Peça um ajuste para acompanhar o fluxo.",
            "O cliente pediu uma frase de apoio mais clara. Publique a versão revisada.",
            "A nova versão mantém o mesmo link. Confira o texto atualizado e aprove.",
            "A aprovação pertence à V2. O pedido anterior continua preservado no histórico.",
          ][step]}</p>
          {step > 0 && <details className="feedback"><summary>Histórico</summary>
            <p>V1 · Ajuste: deixar a frase de apoio mais clara.</p>
            {step >= 2 && <p>V2 · Texto atualizado.</p>}
            {step === 3 && <p>V2 · Aprovada pelo cliente.</p>}
          </details>}
          {step < 3 ? <button onClick={advance}>{["Solicitar ajuste", "Publicar V2", "Aprovar V2"][step]}</button>
            : <button onClick={() => setStep(0)}>Experimentar novamente</button>}
        </div>
      </aside>
    </div>
  </main>;
}
