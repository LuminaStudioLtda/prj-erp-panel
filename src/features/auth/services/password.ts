import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Formato armazenado: scrypt:<salt base64>:<hash base64> (cabe em VarChar(255)). */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt:${salt.toString("base64")}:${key.toString("base64")}`;
}

/** Sempre executa o custo do scrypt, mesmo sem hash, para não revelar se o e-mail existe. */
export async function verifyPassword(password: string, stored: string | null) {
  const [scheme, saltB64, hashB64] = (stored ?? "").split(":");
  const valid = scheme === "scrypt" && saltB64 && hashB64;

  const salt = valid ? Buffer.from(saltB64, "base64") : Buffer.alloc(16);
  const expected = valid
    ? Buffer.from(hashB64, "base64")
    : Buffer.alloc(KEY_LENGTH);
  const actual = await derive(password, salt);

  return (
    Boolean(valid) &&
    expected.length === actual.length &&
    timingSafeEqual(expected, actual)
  );
}
