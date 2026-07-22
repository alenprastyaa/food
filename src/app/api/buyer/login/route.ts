import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { signBuyerSession, setBuyerCookie } from "@/lib/buyerAuth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { phone, password } = await req.json().catch(() => ({}));
  if (!phone || !password) return bad("Nomor HP dan password wajib diisi.");

  const identifier = String(phone).trim();
  const buyer = await prisma.buyer.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier.toLowerCase() }] },
  });
  if (!buyer || !bcrypt.compareSync(password, buyer.password)) return bad("Nomor HP / email atau password salah.", 401);

  const session = { id: buyer.id, name: buyer.name, phone: buyer.phone, email: buyer.email };
  const token = await signBuyerSession(session);
  await setBuyerCookie(token);
  return ok({ buyer: session });
}
