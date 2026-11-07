import Link from "next/link";
import { DeliveryTools } from "./delivery-tools";
import { redirect } from "next/navigation";
import { configured, sessionClient } from "../lib/supabase";
import { signOut } from "./actions";
import { PublishForm } from "./publish-form";
import { ReviewNotifications } from "./review-notifications";
import { RevokeForm } from "./revoke-form";
import { VersionForm } from "./version-form";

type Filters = { q?: string; status?: string; page?: string };
const pageSize = 10;
const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });

export default async function Home({ searchParams }: { searchParams: Promise<Filters> }) {
  if (!configured()) redirect("/login");
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");

  const filters = await searchParams;
  const query = typeof filters.q === "string" ? filters.q.trim().slice(0, 100) : "";
  const filter = typeof filters.status === "string" ? filters.status : "";
  const { data, error } = await client.from("deliveries")
    .select("id,title,expires_at,revoked_at,archived_at,delivery_versions(number,created_at,approved_at,adjustment_requests(comment))").eq("owner_id", user.id).order("created_at", { ascending: false });

  const events = (data ?? []).flatMap(item => item.delivery_versions.flatMap(version => {
    const name = `${item.title} · V${version.number}`;
    const id = `${item.id}:${version.number}`;
    if (version.approved_at) return [{ id: id + ":approved", message: `${name} aprovada.` }];
    const request = Array.isArray(version.adjustment_requests)
      ? version.adjustment_requests[0] : version.adjustment_requests;
    return request ? [{ id: id + ":adjusted", message: `${name} recebeu um pedido de ajuste.` }] : [];
  }));

  const now = Date.now();
  const deliveries = (data ?? []).map(item => ({
    ...item,
    closed: Boolean(item.revoked_at) || Date.parse(item.expires_at) <= now,
    versions: item.delivery_versions.map(version => ({
      number: version.number,
      createdAt: version.created_at,
      approvedAt: version.approved_at,
      request: Array.isArray(version.adjustment_requests)
        ? version.adjustment_requests[0] : version.adjustment_requests,
    })).sort((a, b) => b.number - a.number),
  }));
  const activeCount = deliveries.filter(item => !item.closed).length;
  const matching = deliveries.filter(item => {
    const latest = item.versions[0];
    const status = item.closed ? "closed" : latest?.approvedAt ? "approved" : latest?.request ? "adjustment" : "review";
    return (!query || item.title.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))) &&
      (!filter || filter === status);
  }).sort((a, b) => Number(a.closed) - Number(b.closed));
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const requestedPage = Number(filters.page);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(pages, Math.max(1, requestedPage)) : 1;
  const visible = matching.slice((page - 1) * pageSize, page * pageSize);
  const active = visible.filter(item => !item.closed);
  const closed = visible.filter(item => item.closed);
  function pageHref(number: number) {
    return `/?${new URLSearchParams({ q: query, status: filter, page: String(number) })}`;
  }

  function renderCard(item: (typeof deliveries)[number]) {
    const latest = item.versions[0];
    const status = item.archived_at ? "Arquivada" : item.revoked_at ? "Link revogado" : item.closed ? "Link expirado" :
      latest?.approvedAt ? "Aprovada" : latest?.request ? "Ajuste solicitado" : "Em revisão";

    return <li className="delivery-card" key={item.id}>
      <details>
        <summary>
          <span className="delivery-card-label">
            <span className="delivery-card-title">{item.title}</span>
            <span className="delivery-card-version">V{latest?.number ?? 1}
              {latest?.createdAt && <> · <time dateTime={latest.createdAt}>{dateLabel.format(new Date(latest.createdAt))}</time></>}
            </span>
          </span>
          <span className="delivery-badges">
          {!item.closed && <span className="delivery-badge" data-tone="active">Link ativo</span>}
          <span className="delivery-badge" data-tone={item.closed ? "muted" : latest?.approvedAt ? "approved" : latest?.request ? "adjustment" : "review"}>{status}</span></span>
          <span className="delivery-chevron" aria-hidden="true" />
        </summary>
        <div className="delivery-card-details">
          <div className="delivery-actions">
            <DeliveryTools id={item.id} closed={item.closed} />
            {!item.closed && <>
            <VersionForm deliveryId={item.id} />
            <RevokeForm deliveryId={item.id} />
            </>}
          </div>
          <h3>Histórico de versões</h3>
          <ol className="delivery-history">
            {item.versions.map(version => <li key={version.number}>
              <strong>V{version.number}</strong>
              <span>{version.approvedAt ? "Aprovada" : version.request ? "Ajuste solicitado" : "Publicada"}</span>
              {version.request && <p>{version.request.comment}</p>}
            </li>)}
          </ol>
        </div>
      </details>
    </li>;
  }

  return <main className="dashboard">
    <ReviewNotifications events={events} />
    <div className="heading dashboard-heading">
      <div><p className="eyebrow">Área do freelancer</p><h1>Gerenciar entregas</h1></div>
      <form action={signOut}><button className="secondary">Sair</button></form>
    </div>
    <div className="columns dashboard-columns">
      <section className="delivery-section" aria-labelledby="deliveries-title">
        <div className="delivery-section-heading">
          <h2 id="deliveries-title">Entregas</h2>
          {!error && <span>{activeCount} {activeCount === 1 ? "ativa" : "ativas"}</span>}
        </div>
        {error ? <p role="alert">Não foi possível carregar as entregas.</p> : <>
          {deliveries.length > 0 && <form className="delivery-filters" action="/">
            <label>Buscar entregas<input name="q" type="search" defaultValue={query} placeholder="Nome da entrega" maxLength={100} /></label>
            <label>Status<select name="status" defaultValue={filter}>
              <option value="">Todos</option><option value="review">Em revisão</option>
              <option value="adjustment">Ajuste solicitado</option><option value="approved">Aprovada</option>
              <option value="closed">Links encerrados</option>
            </select></label>
            <button className="secondary">Filtrar</button>
          </form>}
          {active.length ? <ul className="delivery-list">{active.map(renderCard)}</ul> :
            closed.length ? null : <div className="delivery-empty">
              <p>{deliveries.length ? "Nenhuma entrega corresponde aos filtros." : "Nenhuma entrega ainda."}</p>
              {deliveries.length ? <Link href="/">Limpar filtros</Link> : <a href="#nova-entrega">Criar primeira entrega</a>}
            </div>}
          {closed.length > 0 && <details className="closed-deliveries" open={filter === "closed" || active.length === 0 && page > 1 || Boolean(query)}>
            <summary>Links encerrados <span>{closed.length}</span></summary>
            <ul className="delivery-list">{closed.map(renderCard)}</ul>
          </details>}
          {pages > 1 && <nav className="delivery-pagination" aria-label="Paginação de entregas">
            {page > 1 && <Link href={pageHref(page - 1)}>Anterior</Link>}
            <span>Página {page} de {pages}</span>
            {page < pages && <Link href={pageHref(page + 1)}>Próxima</Link>}
          </nav>}
        </>}
      </section>
      <PublishForm />
    </div>
  </main>;
}
