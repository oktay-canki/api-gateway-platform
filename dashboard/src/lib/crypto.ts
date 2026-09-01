import crypto from "crypto";
import argon2 from "argon2";

export function createApiKey() {
  return crypto.randomBytes(24).toString("base64url");
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function hashPassword(plainPassword: string) {
  return argon2.hash(plainPassword);
}
