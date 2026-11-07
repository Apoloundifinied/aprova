import { ReviewActions } from "./adjustment-form";
import { notFound } from "next/navigation";
import { adminClient, configured } from "../../../lib/supabase";
import { hashReviewToken } from "../../../lib/review";

export const dynamic = "force-dynamic";

export default async function Review({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!configured() || !/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();
  const admin = adminClient();
  const { data: delivery, error } = await admin.from("deliveries")
    .select("id,title").eq("review_hash", hashReviewToken(token))
    .is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("Falha ao consultar a revisão.");
  if (!delivery) notFound();

  const { data: version, error: versionError } = await admin.from("delivery_versions")
    .select("id,number,storage_path,approved_at,adjustment_requests(comment)").eq("delivery_id", delivery.id)
    .order("number", { ascending: false }).limit(1).maybeSingle();
  if (versionError) throw new Error("Falha ao consultar a versão.");
  if (!version) notFound();
  const { data: image, error: imageError } = await admin.storage.from("review-files").createSignedUrl(version.storage_path, 60);
  if (imageError || !image) throw new Error("Falha ao abrir a imagem.");

  const feedback = Array.isArray(version.adjustment_requests)
    ? version.adjustment_requests[0] : version.adjustment_requests;

  return <main><p className="eyebrow">Revisão de entrega</p><h1>{delivery.title}</h1>
    <div className="columns review">
      <div className="preview"><img src={image.signedUrl} alt={`Arte de ${delivery.title}, versão ${version.number}`} /></div>
      <aside className="panel"><h2>Revisão</h2><p className="version">V{version.number} · Atual</p><p className="muted">Confira a imagem enviada pelo freelancer.</p>
        <ReviewActions key={version.id} token={token} versionId={version.id}
          versionNumber={version.number} approved={Boolean(version.approved_at)} feedback={feedback?.comment} />
      </aside>
    </div>
  </main>;
}
