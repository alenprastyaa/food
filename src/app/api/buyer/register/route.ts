import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { signBuyerSession, setBuyerCookie } from "@/lib/buyerAuth";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const { name, phone, email, address } = b;
  if (!name?.trim() || !phone?.trim()) return bad("Nama dan nomor HP wajib diisi.");

  const phoneClean = String(phone).trim();
  const exists = await prisma.buyer.findUnique({ where: { phone: phoneClean } });
  if (exists) return bad("Nomor HP sudah terdaftar. Silakan masuk.", 409);

  if (email) {
    const emailExists = await prisma.buyer.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (emailExists) return bad("Email sudah terdaftar.", 409);
  }

  const buyer = await prisma.buyer.create({
    data: {
      name: String(name).trim(),
      phone: phoneClean,
      email: email ? String(email).toLowerCase().trim() : null,
      address: address || null,
    },
  });

  const session = { id: buyer.id, name: buyer.name, phone: buyer.phone, email: buyer.email };
  const token = await signBuyerSession(session);
  await setBuyerCookie(token);
  return ok({ buyer: session });
}
