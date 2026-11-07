import { redirect } from "next/navigation";
import { configured, sessionClient } from "../lib/supabase";
import { revokeLink, signOut } from "./actions";
import { PublishForm } from "./publish-form";
import { VersionForm } from "./version-form";

export default async function Home() {
  if (!configured()) redirect("/login");
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await client.from("deliveries")
    .select("id,title,expires_at,revoked_at,delivery_versions(number,approved_at,adjustment_requests(comment))").eq("owner_id", user.id).order("created_at", { ascending: false });

  return <main>
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
              {versions.filter(version => version.approvedAt).map(version =>
                <p className="version" key={version.number}>V{version.number} aprovada.</p>
              )}
              {versions.map(version => version.request &&
                <div className="feedback" key={version.number}>
                  <strong>Pedido de ajuste · V{version.number}</strong>
                  <p>{version.request.comment}</p>
                </div>
              )}
            </div>
              {!revoked && !expired && <div className="delivery-actions"><VersionForm deliveryId={item.id} /><form action={revokeLink}><input type="hidden" name="delivery" value={item.id} /><button className="secondary">Revogar link</button></form></div>}
            </li>;
          })}</ul>}
      </section>
      <PublishForm />
    </div>
  </main>;
}
