"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminClient, sessionClient } from "../lib/supabase";
import { createReviewToken, detectImage, hashReviewToken } from "../lib/review";

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

export async function publishDelivery(_: PublishResult, form: FormData): Promise<PublishResult> {
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: "Entre na sua conta para publicar." };

  const title = String(form.get("title") ?? "").trim();
  const file = form.get("file");
  if (!title || title.length > 100) return { error: "Informe um título de até 100 caracteres." };
  if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) {
    return { error: "Envie uma imagem de até 3 MB." };
  }
  const bytes = await file.arrayBuffer();
  const mime = detectImage(new Uint8Array(bytes));
  if (!mime) return { error: "Use uma imagem PNG, JPEG ou WebP." };

  const id = randomUUID();
  const path = `${user.id}/${id}/v1`;
  const token = createReviewToken();
  const admin = adminClient();
  const files = admin.storage.from("review-files");
  const upload = await files.upload(path, bytes, { contentType: mime, upsert: false });
  if (upload.error) return { error: "Falha ao enviar a imagem. Tente novamente." };

  const publish = await admin.rpc("publish_initial_delivery", {
    delivery_id: id, owner: user.id, delivery_title: title,
    token_hash: hashReviewToken(token), object_path: path,
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

export async function revokeLink(form: FormData) {
  const id = String(form.get("delivery") ?? "");
  if (!/^[a-f0-9-]{36}$/i.test(id)) return;
  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await adminClient().from("deliveries")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id).eq("owner_id", user.id).is("revoked_at", null);
  if (error) throw new Error("Não foi possível revogar o link.");
  revalidatePath("/");
}
