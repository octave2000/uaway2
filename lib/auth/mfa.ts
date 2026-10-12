import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function isAdminMfaRequired() {
  // Admin MFA can be disabled for a local demo, but never in production.
  return (
    process.env.NODE_ENV === "production" ||
    process.env.ADMIN_MFA_REQUIRED !== "false"
  );
}
export function newSecret() {
  return Array.from(randomBytes(32), (b) => alphabet[b % 32]).join("");
}
function decode(secret: string) {
  const bits = Array.from(secret, (c) =>
    alphabet.indexOf(c).toString(2).padStart(5, "0"),
  ).join("");
  return Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
}
export function totp(secret: string, step: number) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", decode(secret)).update(bytes).digest();
  const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1000000).padStart(6, "0");
}
export function validTotp(secret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const step = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((d) =>
    timingSafeEqual(Buffer.from(totp(secret, step + d)), Buffer.from(code)),
  );
}
const key = () =>
  createHash("sha256").update(process.env.AUTH_SECRET!).digest();
export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function decryptSecret(value: string) {
  const data = Buffer.from(value, "base64url");
  const cipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  cipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([
    cipher.update(data.subarray(28)),
    cipher.final(),
  ]).toString("utf8");
}
function sign(payload: string) {
  return createHmac("sha256", key()).update(payload).digest("base64url");
}
export async function setMfa(userId: string) {
  const payload = `${userId}:${Date.now() + 3600000}`;
  await (
    await cookies()
  ).set("uaway-mfa", `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
  });
}
export async function hasMfa(userId: string) {
  const raw = (await cookies()).get("uaway-mfa")?.value;
  if (!raw) return false;
  const [payload, signature] = raw.split(".");
  const expected = sign(payload);
  if (!signature || signature.length !== expected.length) return false;
  const [id, expiry] = payload.split(":");
  return (
    id === userId &&
    Number(expiry) > Date.now() &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}
