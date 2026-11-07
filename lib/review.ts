import "server-only";
import { createHash, randomBytes } from "node:crypto";

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
