import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
test("permissões, histórico, concorrência, aprovação e links", { skip: !url || !secret || !publicKey }, async t => {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, secret, options);
  const ids = [], clients = [];
  const id = randomUUID();
  const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
  async function ok(request) {
    const result = await request;
    assert.equal(result.error, null, result.error?.message);
    return result.data;
  }
  try {
    for (let i = 0; i < 2; i++) {
      const email = `aprova-test-${randomUUID()}@example.com`;
      const password = randomBytes(32).toString("base64url");
      const user = await ok(admin.auth.admin.createUser({ email, password, email_confirm: true }));
      ids.push(user.user.id);
      const client = createClient(url, publicKey, options);
      await ok(client.auth.signInWithPassword({ email, password }));
      clients.push(client);
    }
    await ok(admin.rpc("publish_initial_delivery", {
      delivery_id: id, owner: ids[0], delivery_title: "Fixture temporária",
      token_hash: tokenHash, object_path: `tests/${id}/v1`,
    }));
    const v1 = (await ok(admin.from("delivery_versions").select("id").eq("delivery_id", id).single())).id;
    await t.test("somente o dono lê a entrega e as versões", async () => {
      assert.equal((await ok(clients[0].from("deliveries").select("id").eq("id", id))).length, 1);
      assert.equal((await ok(clients[1].from("deliveries").select("id").eq("id", id))).length, 0);
      assert.equal((await ok(clients[1].from("delivery_versions").select("id").eq("delivery_id", id))).length, 0);
      const anonymous = createClient(url, publicKey, options);
      const attempt = await anonymous.rpc("approve_version", { token_hash: tokenHash, reviewed_version: v1 });
      assert.ok(attempt.error, "RPC privilegiada não deve estar acessível anonimamente");
    });
    await t.test("pedido de ajuste impede aprovação e preserva comentário", async () => {
      assert.equal(await ok(admin.rpc("request_adjustment", { token_hash: tokenHash, reviewed_version: v1, feedback: "Aumentar contraste" })), "requested");
      assert.equal(await ok(admin.rpc("approve_version", { token_hash: tokenHash, reviewed_version: v1 })), "adjustment_requested");
    });
    await t.test("publicações concorrentes recebem números únicos", async () => {
      const numbers = await Promise.all([2, 3].map(n => ok(admin.rpc("publish_delivery_version", {
        target_delivery: id, owner: ids[0], object_path: `tests/${id}/v${n}`,
      }))));
      assert.deepEqual(numbers.sort(), [2, 3]);
      assert.equal(await ok(admin.rpc("approve_version", { token_hash: tokenHash, reviewed_version: v1 })), "stale_version");
      const feedback = await ok(admin.from("adjustment_requests").select("comment").eq("version_id", v1).single());
      assert.equal(feedback.comment, "Aumentar contraste");
    });
    const latest = (await ok(admin.from("delivery_versions").select("id").eq("delivery_id", id).eq("number", 3).single())).id;
    await t.test("aprovação repetida mantém a data original", async () => {
      const args = { token_hash: tokenHash, reviewed_version: latest };
      assert.equal(await ok(admin.rpc("approve_version", args)), "approved");
      const first = await ok(admin.from("delivery_versions").select("approved_at").eq("id", latest).single());
      assert.equal(await ok(admin.rpc("approve_version", args)), "approved");
      const second = await ok(admin.from("delivery_versions").select("approved_at").eq("id", latest).single());
      assert.equal(first.approved_at, second.approved_at);
    });
    await t.test("links revogados e expirados bloqueiam decisões", async () => {
      await ok(admin.from("deliveries").update({ revoked_at: new Date().toISOString() }).eq("id", id));
      assert.equal(await ok(admin.rpc("approve_version", { token_hash: tokenHash, reviewed_version: latest })), "invalid_link");
      await ok(admin.from("deliveries").update({ revoked_at: null, expires_at: "2020-01-01T00:00:00Z" }).eq("id", id));
      assert.equal(await ok(admin.rpc("request_adjustment", { token_hash: tokenHash, reviewed_version: latest, feedback: "Teste" })), "invalid_link");
    });
  } finally {
    await ok(admin.from("deliveries").delete().eq("id", id));
    for (const client of clients) await client.auth.signOut();
    for (const userId of ids) await ok(admin.auth.admin.deleteUser(userId));
  }
});
