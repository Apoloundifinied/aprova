import { test } from "node:test";
import assert from "node:assert/strict";
import { createReviewToken, hashReviewToken, encryptReviewToken, decryptReviewToken, detectImage } from "../lib/review.ts";

test("tokens são únicos e têm o formato aceito pelas rotas", () => {
  const tokens = Array.from({ length: 100 }, createReviewToken);
  assert.equal(new Set(tokens).size, 100);
  for (const token of tokens) assert.match(token, /^[A-Za-z0-9_-]{43}$/);
});
test("links criptografados rejeitam adulteração e chave diferente", () => {
  process.env.SUPABASE_SECRET_KEY = "test-only-not-a-real-key";
  const token = createReviewToken();
  const encoded = encryptReviewToken(token);
  assert.equal(decryptReviewToken(encoded), token);
  assert.notEqual(hashReviewToken(token), token);
  const bytes = Buffer.from(encoded, "base64url");
  bytes[20] ^= 1;
  assert.throws(() => decryptReviewToken(bytes.toString("base64url")));
  process.env.SUPABASE_SECRET_KEY = "another-test-only-key";
  assert.throws(() => decryptReviewToken(encoded));
  delete process.env.SUPABASE_SECRET_KEY;
});
test("assinaturas de arquivo não dependem da extensão declarada", () => {
  assert.equal(detectImage(Buffer.from("<script>alert(1)</script>")), null);
  assert.equal(detectImage(Buffer.from([137,80,78,71,13,10,26,10])), "image/png");
  assert.equal(detectImage(Buffer.from([255,216,255,224])), "image/jpeg");
  assert.equal(detectImage(Buffer.from("RIFF0000WEBP")), "image/webp");
  assert.equal(detectImage(new Uint8Array()), null);
});
