export default function Loading() {
  return <main aria-busy="true" aria-label="Carregando revisão">
    <p role="status" className="muted">Preparando a revisão…</p>
    <div className="skeleton skeleton-title" />
    <div className="columns review" aria-hidden="true">
      <div className="skeleton review-preview" /><div className="skeleton skeleton-form" />
    </div>
  </main>;
}
