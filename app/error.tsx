"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="login"><section className="panel">
    <p className="eyebrow">Não foi possível continuar</p>
    <h1>Vamos tentar novamente?</h1>
    <p className="muted">Confira sua conexão. Se você estava publicando, consulte o histórico antes de reenviar o arquivo.</p>
    <button onClick={reset}>Tentar novamente</button>
  </section></main>;
}
