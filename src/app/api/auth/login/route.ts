import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie } from "@/lib/auth";
import { ok, bad } from "@/lib/api";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return bad("Email dan password wajib diisi.");

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !bcrypt.compareSync(password, user.password)) return bad("Email atau password salah.", 401);

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "OWNER" | "CASHIER",
    outletId: user.outletId,
  };
  const token = await signSession(session);
  await setSessionCookie(token);
  return ok({ user: session });
}
