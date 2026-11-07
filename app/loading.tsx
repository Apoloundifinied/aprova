export default function Loading() {
  return <main className="dashboard" aria-busy="true" aria-label="Carregando entregas">
    <p role="status" className="muted">Preparando suas entregas…</p>
    <div className="skeleton skeleton-title" />
    <div className="columns dashboard-columns" aria-hidden="true">
      <div className="fields">{[0, 1, 2, 3].map(item => <div key={item} className="skeleton skeleton-card" />)}</div>
      <div className="skeleton skeleton-form" />
    </div>
  </main>;
}
