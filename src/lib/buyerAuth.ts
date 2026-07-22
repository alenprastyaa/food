import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const COOKIE = "nashi_buyer";

export type SessionBuyer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export async function signBuyerSession(buyer: SessionBuyer) {
  return await new SignJWT({ ...buyer })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function setBuyerCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearBuyerSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getBuyerSession(): Promise<SessionBuyer | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      name: payload.name as string,
      phone: payload.phone as string,
      email: (payload.email as string) ?? null,
    };
  } catch {
    return null;
  }
}
