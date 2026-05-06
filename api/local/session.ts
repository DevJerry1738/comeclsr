import * as jose from "jose";
import { env } from "../lib/env";

const JWT_ALG = "HS256";

export async function signLocalSessionToken(payload: { userId: number; role: string }): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifyLocalSessionToken(token: string): Promise<{ userId: number; role: string } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    const userId = payload.userId as number;
    const role = payload.role as string;
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}
