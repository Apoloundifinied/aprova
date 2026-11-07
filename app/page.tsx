import { redirect } from "next/navigation";
import { configured, sessionClient } from "../lib/supabase";
import { revokeLink, signOut } from "./actions";
import { PublishForm } from "./publish-form";

export default async function Home() {
  if (!configured()) redirect("/login");
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await client.from("deliveries")
    .select("id,title,expires_at,revoked_at").eq("owner_id", user.id).order("created_at", { ascending: false });

  return <main>
    <div className="heading"><div><p className="eyebrow">Área do freelancer</p><h1>Gerenciar entregas</h1></div><form action={signOut}><button className="secondary">Sair</button></form></div>
    <div className="columns">
      <section className="panel"><h2>Entregas</h2>
        {error ? <p role="alert">Não foi possível carregar as entregas.</p> : data.length === 0 ? <p className="muted">Sua primeira entrega aparece aqui depois de publicar a V1.</p> :
          <ul>{data.map(item => {
            const revoked = Boolean(item.revoked_at);
            const expired = Date.parse(item.expires_at) <= Date.now();
            return <li key={item.id}><div><strong>{item.title}</strong><p className="muted">V1 · {revoked ? "Link revogado" : expired ? "Link expirado" : "Em revisão"}</p></div>
              {!revoked && !expired && <form action={revokeLink}><input type="hidden" name="delivery" value={item.id} /><button className="secondary">Revogar link</button></form>}
            </li>;
          })}</ul>}
      </section>
      <PublishForm />
    </div>
  </main>;
}
