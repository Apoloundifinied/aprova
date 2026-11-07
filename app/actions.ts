"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminClient, sessionClient } from "../lib/supabase";
import { createReviewToken, decryptReviewToken, detectImage, encryptReviewToken, hashReviewToken } from "../lib/review";

export async function signIn(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const client = await sessionClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?erro=1");
  redirect("/");
}

export async function signOut() {
  const client = await sessionClient();
  await client.auth.signOut();
  redirect("/login");
}

export type PublishResult = { error?: string; link?: string };

async function readImage(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) {
    return { error: "Envie uma imagem de até 3 MB." };
  }
  const bytes = await file.arrayBuffer();
  const mime = detectImage(new Uint8Array(bytes));
  if (!mime) return { error: "Use uma imagem PNG, JPEG ou WebP." };
  return { bytes, mime };
}

export async function publishDelivery(_: PublishResult, form: FormData): Promise<PublishResult> {
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: "Entre na sua conta para publicar." };

  const title = String(form.get("title") ?? "").trim();
  if (!title || title.length > 100) return { error: "Informe um título de até 100 caracteres." };
  const image = await readImage(form);
  if ("error" in image) return image;
  const { bytes, mime } = image;

  const id = randomUUID();
  const path = `${user.id}/${id}/v1`;
  const token = createReviewToken();
  const admin = adminClient();
  const files = admin.storage.from("review-files");
  const upload = await files.upload(path, bytes, { contentType: mime, upsert: false });
  if (upload.error) return { error: "Falha ao enviar a imagem. Tente novamente." };

  const publish = await admin.rpc("publish_initial_delivery", {
    delivery_id: id, owner: user.id, delivery_title: title,
    token_hash: hashReviewToken(token), object_path: path, token_ciphertext: encryptReviewToken(token),
  });
  if (publish.error) {
    // Check whether a connection error happened after the transaction committed.
    const persisted = await admin.from("deliveries").select("id").eq("id", id).maybeSingle();
    if (!persisted.data) {
      if (!persisted.error) await files.remove([path]);
      return { error: "Não foi possível confirmar a publicação." };
    }
  }

  revalidatePath("/");
  return { link: `/revisao/${token}` };
}

export type VersionResult = { error?: string; number?: number };

export async function publishVersion(id: string, _: VersionResult, form: FormData): Promise<VersionResult> {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Entrega indisponível." };
  }
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: "Entre na sua conta para publicar." };

  const { data: delivery, error: lookupError } = await client.from("deliveries")
    .select("id").eq("id", id).eq("owner_id", user.id)
    .is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (lookupError || !delivery) return { error: "Entrega ou link indisponível." };

  const image = await readImage(form);
  if ("error" in image) return image;

  const admin = adminClient();
  const files = admin.storage.from("review-files");
  const path = `${user.id}/${id}/${randomUUID()}`;
  const upload = await files.upload(path, image.bytes, { contentType: image.mime, upsert: false });
  if (upload.error) return { error: "Falha ao enviar a imagem. Tente novamente." };

  const result = await admin.rpc("publish_delivery_version", {
    target_delivery: id, owner: user.id, object_path: path,
  });
  let number = result.data;
  if (result.error) {
    const persisted = await admin.from("delivery_versions").select("number")
      .eq("storage_path", path).maybeSingle();
    if (persisted.error) return { error: "Não foi possível confirmar a publicação. Recarregue para consultar o histórico." };
    number = persisted.data?.number;
  }
  if (typeof number !== "number") {
    await files.remove([path]);
    return { error: "Não foi possível publicar a versão. Confira se o link ainda está ativo." };
  }

  revalidatePath("/");
  return { number };
}

export async function revokeLink(form: FormData) {
  const id = String(form.get("delivery") ?? "");
  if (!/^[a-f0-9-]{36}$/i.test(id)) return { error: "Entrega indisponível." };
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await adminClient().from("deliveries")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id).eq("owner_id", user.id).is("revoked_at", null).select("id").maybeSingle();
  if (error || !data) return { error: "Não foi possível revogar o link." };
  revalidatePath("/");
  return { error: undefined };
}

export async function manageDelivery(id: string, intent: string): Promise<PublishResult & { message?: string }> {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return { error: "Entrega indisponível." };
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: "Entre na sua conta para gerenciar a entrega." };

  const admin = adminClient();
  const { data: delivery, error } = await admin.from("deliveries")
    .select("review_hash,review_ciphertext,revoked_at,expires_at,archived_at")
    .eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (error || !delivery) return { error: "Entrega indisponível." };

  if (intent === "link") {
    if (delivery.revoked_at || delivery.archived_at || Date.parse(delivery.expires_at) <= Date.now()) {
      return { error: "Este link está encerrado. Gere um novo para compartilhar." };
    }
    if (delivery.review_ciphertext) {
      try {
        const token = decryptReviewToken(delivery.review_ciphertext);
        if (hashReviewToken(token) === delivery.review_hash) return { link: `/revisao/${token}` };
      } catch {
        // Links encrypted with a previous server key can be regenerated.
      }
    }
    return { error: "O endereço original não está disponível aqui. Gere um novo link para compartilhar." };
  }

  if (intent === "archive") {
    const now = new Date().toISOString();
    const { data, error } = await admin.from("deliveries")
      .update({ archived_at: now, revoked_at: now })
      .eq("id", id).eq("owner_id", user.id).is("archived_at", null).select("id").maybeSingle();
    if (error || !data) return { error: "Não foi possível arquivar a entrega." };
    revalidatePath("/");
    return { message: "Entrega arquivada e link encerrado." };
  }

  if (intent === "renew") {
    const token = createReviewToken();
    const { data, error } = await admin.from("deliveries").update({
      review_hash: hashReviewToken(token),
      review_ciphertext: encryptReviewToken(token),
      revoked_at: null,
      archived_at: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("id", id).eq("owner_id", user.id).eq("review_hash", delivery.review_hash)
      .select("id").maybeSingle();
    if (error || !data) return { error: "Não foi possível gerar outro link. Atualize a página e tente novamente." };
    revalidatePath("/");
    return { link: `/revisao/${token}`, message: "Novo link de revisão gerado." };
  }

  return { error: "Ação indisponível." };
}
