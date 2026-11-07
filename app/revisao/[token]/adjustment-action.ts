"use server";

import { revalidatePath } from "next/cache";
import { adminClient, configured } from "../../../lib/supabase";
import { hashReviewToken } from "../../../lib/review";

export type AdjustmentState = { message?: string; error?: string };

export async function requestAdjustment(
  token: string, versionId: string, _: AdjustmentState, form: FormData,
): Promise<AdjustmentState> {
  const value = form.get("comment");
  const comment = typeof value === "string" ? value.trim() : "";
  if (!comment || comment.length > 1000) return { error: "Escreva um comentário de até 1.000 caracteres." };
  if (!configured() || !/^[A-Za-z0-9_-]{43}$/.test(token) ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(versionId)) {
    return { error: "Link de revisão indisponível." };
  }

  const { data, error } = await adminClient().rpc("request_adjustment", {
    token_hash: hashReviewToken(token), reviewed_version: versionId, feedback: comment,
  });
  if (error) return { error: "Não foi possível registrar o pedido. Tente novamente." };
  if (data === "invalid_link") return { error: "Este link expirou ou foi revogado." };
  if (data === "stale_version") return { error: "A versão mudou. Recarregue a página e confira o arquivo atual." };
  if (data === "already_approved") return { error: "Esta versão já foi aprovada." };
  if (data !== "requested" && data !== "already_requested") return { error: "Não foi possível confirmar o pedido." };

  revalidatePath("/");
  revalidatePath(`/revisao/${token}`);
  return { message: data === "requested" ? "Pedido de ajuste enviado." : "Já existe um pedido de ajuste nesta versão." };
}

export async function approveVersion(
  token: string, versionId: string, _: AdjustmentState,
): Promise<AdjustmentState> {
  if (!configured() || !/^[A-Za-z0-9_-]{43}$/.test(token) ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(versionId)) {
    return { error: "Link de revisão indisponível." };
  }

  const { data, error } = await adminClient().rpc("approve_version", {
    token_hash: hashReviewToken(token), reviewed_version: versionId,
  });
  if (error) return { error: "Não foi possível confirmar a aprovação. Tente novamente." };
  if (data === "invalid_link") return { error: "Este link expirou ou foi revogado." };
  if (data === "stale_version") return { error: "A versão mudou. Recarregue e confira o arquivo atual." };
  if (data === "adjustment_requested") return { error: "Há um ajuste solicitado. Aguarde uma nova versão." };
  if (data !== "approved") return { error: "Não foi possível confirmar a aprovação." };

  revalidatePath("/");
  revalidatePath(`/revisao/${token}`);
  return { message: "Versão aprovada." };
}
