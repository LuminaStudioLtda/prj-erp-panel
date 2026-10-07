import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "lumina_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32
    ? new TextEncoder().encode(secret)
    : null;
}

/** Gera o token assinado da sessão. Retorna null se SESSION_SECRET não estiver configurado. */
export async function signSessionToken(userId: string) {
  const key = getSessionKey();
  if (!key) return null;

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

/** Retorna o id do usuário se o token for válido e não expirado; caso contrário null. */
export async function verifySessionToken(token: string | null | undefined) {
  const key = getSessionKey();
  if (!key || !token) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
