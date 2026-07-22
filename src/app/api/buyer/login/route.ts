import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { signBuyerSession, setBuyerCookie } from "@/lib/buyerAuth";

// Buyer masuk cukup pakai nomor HP — tanpa password. Nomor baru otomatis didaftarkan.
export async function POST(req: Request) {
  const { name, phone } = await req.json().catch(() => ({}));
  const phoneClean = String(phone || "").trim();
  if (!phoneClean) return bad("Nomor HP wajib diisi.");

  let buyer = await prisma.buyer.findUnique({ where: { phone: phoneClean } });
  if (!buyer) {
    if (!name?.trim()) return bad("Nomor HP belum terdaftar — isi nama untuk membuat akun baru.");
    buyer = await prisma.buyer.create({ data: { name: String(name).trim(), phone: phoneClean } });
  }

  // tautkan order/percakapan lama yang dibuat sebagai tamu (sebelum login) dengan nomor HP yang sama
  await prisma.order.updateMany({ where: { buyerId: null, buyerPhone: phoneClean }, data: { buyerId: buyer.id } });
  await prisma.conversation.updateMany({ where: { buyerId: null, buyerPhone: phoneClean }, data: { buyerId: buyer.id } });

  const session = { id: buyer.id, name: buyer.name, phone: buyer.phone, email: buyer.email };
  const token = await signBuyerSession(session);
  await setBuyerCookie(token);
  return ok({ buyer: session });
}
