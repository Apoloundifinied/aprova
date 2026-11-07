import { redirect } from "next/navigation";
import { configured, sessionClient } from "../lib/supabase";
import { signOut } from "./actions";
import { PublishForm } from "./publish-form";
import { ReviewNotifications } from "./review-notifications";
import { RevokeForm } from "./revoke-form";
import { VersionForm } from "./version-form";

export default async function Home() {
  if (!configured()) redirect("/login");
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await client.from("deliveries")
    .select("id,title,expires_at,revoked_at,delivery_versions(number,approved_at,adjustment_requests(comment))").eq("owner_id", user.id).order("created_at", { ascending: false });

  const events = (data ?? []).flatMap(item => item.delivery_versions.flatMap(version => {
    const name = `${item.title} · V${version.number}`;
    const id = `${item.id}:${version.number}`;
    if (version.approved_at) return [{ id: id + ":approved", message: `${name} aprovada.` }];
    const request = Array.isArray(version.adjustment_requests)
      ? version.adjustment_requests[0] : version.adjustment_requests;
    return request ? [{ id: id + ":adjusted", message: `${name} recebeu um pedido de ajuste.` }] : [];
  }));

  return <main>
    <ReviewNotifications events={events} />
    <div className="heading"><div><p className="eyebrow">Área do freelancer</p><h1>Gerenciar entregas</h1></div><form action={signOut}><button className="secondary">Sair</button></form></div>
    <div className="columns">
      <section className="panel"><h2>Entregas</h2>
        {error ? <p role="alert">Não foi possível carregar as entregas.</p> : data.length === 0 ? <p className="muted">Sua primeira entrega aparece aqui depois de publicar a V1.</p> :
          <ul>{data.map(item => {
            const revoked = Boolean(item.revoked_at);
            const expired = Date.parse(item.expires_at) <= Date.now();
            const versions = item.delivery_versions.map(version => ({
              number: version.number,
              approvedAt: version.approved_at,
              request: Array.isArray(version.adjustment_requests)
                ? version.adjustment_requests[0] : version.adjustment_requests,
            })).sort((a, b) => b.number - a.number);
            const latest = versions[0];
            const status = revoked ? "Link revogado" : expired ? "Link expirado" :
              latest?.approvedAt ? "Aprovada" : latest?.request ? "Ajuste solicitado" : "Em revisão";
            return <li className="delivery-row" key={item.id}><div><strong>{item.title}</strong><p className="muted">V{latest?.number ?? 1} · {status}</p>
            </div>
              {!revoked && !expired && <div className="delivery-actions">
                <VersionForm deliveryId={item.id} />
                <RevokeForm deliveryId={item.id} />
              </div>}
              {versions.length > 0 && <details className="delivery-history">
                <summary>Histórico · {versions.length} {versions.length === 1 ? "versão" : "versões"}</summary>
                <ol>
                  {versions.map(version => <li key={version.number}>
                    <strong>V{version.number} · {version.approvedAt ? "Aprovada" : version.request ? "Ajuste solicitado" : "Publicada"}</strong>
                    {version.request && <p>{version.request.comment}</p>}
                  </li>)}
                </ol>
              </details>}
            </li>;
          })}</ul>}
      </section>
      <PublishForm />
    </div>
  </main>;
}
