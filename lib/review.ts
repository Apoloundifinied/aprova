import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function createReviewToken() {
  return randomBytes(32).toString("base64url");
}

export function hashReviewToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function detectImage(bytes: Uint8Array) {
  const content = Buffer.from(bytes);
  if (content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (content[0] === 255 && content[1] === 216 && content[2] === 255) return "image/jpeg";
  if (content.toString("ascii", 0, 4) === "RIFF" && content.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function reviewEncryptionKey() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Chave secreta do Supabase indisponível.");
  return createHash("sha256").update("aprova:review-link:v1:").update(secret).digest();
}

export function encryptReviewToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", reviewEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function decryptReviewToken(value: string) {
  const bytes = Buffer.from(value, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", reviewEncryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}
