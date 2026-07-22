import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// real photo paths sourced from Wikimedia Commons (scripts/fetch-photos.mjs), keyed by dish
const manifestPath = path.join(__dirname, "..", "scripts", "photo-manifest.json");
const photoManifest: Record<string, string> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const photo = (key: string, fallbackEmoji: string) => photoManifest[key] ?? fallbackEmoji;

// A simple, real-looking static QRIS placeholder (SVG data URI)
const qrisSvg = (label: string) => {
  // deterministic pseudo-random module pattern
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const n = 25;
  const cell = 8;
  const size = n * cell;
  let rects = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (rnd() > 0.5) rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`;
    }
  }
  // finder patterns
  const finder = (fx: number, fy: number) =>
    `<rect x="${fx}" y="${fy}" width="${cell * 7}" height="${cell * 7}" fill="#0b1f2a"/>` +
    `<rect x="${fx + cell}" y="${fy + cell}" width="${cell * 5}" height="${cell * 5}" fill="#fff"/>` +
    `<rect x="${fx + cell * 2}" y="${fy + cell * 2}" width="${cell * 3}" height="${cell * 3}" fill="#0b1f2a"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#fff"/><g fill="#0b1f2a">${rects}</g>${finder(0, 0)}${finder(size - cell * 7, 0)}${finder(0, size - cell * 7)}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

const MENU = [
  // Katsu
  { name: "Chicken / Dori Katsu Happy", category: "Katsu", price: 14000, image: photo("katsu-happy", "🍤"), desc: "Katsu ayam / dori krispi di atas nasi hangat. Menu paling hemat." },
  { name: "Chicken / Dori Katsu Sambal Matah / Geprek", category: "Katsu", price: 19000, image: photo("katsu-sambal", "🌶️"), desc: "Katsu disiram sambal matah segar atau digeprek pedas nampol." },
  { name: "Chic / Dori Katsu", category: "Katsu", price: 11000, image: photo("katsu-plain", "🍗"), desc: "Potongan katsu ayam / dori tanpa nasi. Cocok jadi lauk." },
  // Donburi
  { name: "Chicken Teriyaki Donburi", category: "Donburi", price: 20000, image: photo("teriyaki-donburi", "🍱"), desc: "Ayam teriyaki manis gurih di atas nasi Jepang." },
  { name: "Chic / Dori Katsu Curry Donburi", category: "Donburi", price: 21000, image: photo("curry-donburi", "🍛"), desc: "Katsu disiram kari Jepang kental ala Hokkaido." },
  { name: "Hokkaido Dori / Chic Katsu Donburi", category: "Donburi", price: 21000, image: photo("hokkaido-donburi", "🍥"), desc: "Signature donburi dengan saus creamy khas Hokkaido." },
  { name: "Chicken / Dori Katsu Donburi", category: "Donburi", price: 20000, image: photo("katsu-donburi", "🍚"), desc: "Donburi katsu klasik dengan saus tonkatsu." },
  { name: "Chicken Popcorn Sweet Chili Oil", category: "Donburi", price: 20000, image: photo("popcorn-sweetchili", "🍿"), desc: "Popcorn chicken dengan sweet chili oil yang menggoda." },
  { name: "Chicken Egg Roll Donburi", category: "Donburi", price: 18000, image: photo("eggroll-donburi", "🥚"), desc: "Egg roll gulung lembut dipadu ayam di atas nasi." },
  { name: "Chicken Popcorn Spicy Bbq", category: "Donburi", price: 17000, image: photo("popcorn-bbq", "🔥"), desc: "Popcorn chicken bumbu BBQ pedas manis." },
  { name: "Chicken Karage Donburi", category: "Donburi", price: 20000, image: photo("karage-donburi", "🍗"), desc: "Karaage juicy renyah di atas nasi hangat." },
  { name: "Shrimp Roll Donburi", category: "Donburi", price: 18000, image: photo("shrimp-donburi", "🍤"), desc: "Shrimp roll krispi dengan mayo spesial." },
  // Snack
  { name: "Chic Skin", category: "Snack", price: 8000, image: photo("chicskin", "🍘"), desc: "Kulit ayam krispi gurih, cemilan wajib." },
  { name: "Shrimp Roll", category: "Snack", price: 15000, image: photo("shrimproll", "🍤"), desc: "Gulungan udang renyah isi 5." },
  { name: "Egg Chic Roll", category: "Snack", price: 15000, image: photo("eggroll", "🥚"), desc: "Egg roll isi ayam, lembut di dalam garing di luar." },
  { name: "Mix Chic & Shrimp", category: "Snack", price: 16000, image: photo("mixsnack", "🍢"), desc: "Kombinasi ayam & udang dalam satu porsi." },
  { name: "Skin Gyoza Bbq / Keju", category: "Snack", price: 5000, image: photo("gyozabbq", "🥟"), desc: "Kulit gyoza renyah rasa BBQ atau keju." },
  { name: "Takoyaki Ball", category: "Snack", price: 15000, image: photo("takoyaki", "🐙"), desc: "Takoyaki isi gurita dengan katsuobushi menari." },
  { name: "Gyoza Fried", category: "Snack", price: 15000, image: photo("gyozafried", "🥟"), desc: "Gyoza goreng isi ayam, garing sempurna." },
  { name: "Chicken Karage", category: "Snack", price: 16000, image: photo("karage", "🍗"), desc: "Karaage ayam tanpa nasi, isi banyak." },
  // Drink
  { name: "Teh Ocha", category: "Drink", price: 3000, image: photo("ocha", "🍵"), desc: "Ocha hangat/dingin menyegarkan." },
  // Extra
  { name: "Extra Saus / Sambal / Telor", category: "Extra", price: 4000, image: photo("extra", "🍳"), desc: "Tambahan saus, sambal, atau telur." },
];

async function main() {
  console.log("🌱 Seeding Nashi Katsu...");
  // wipe
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.outletPayment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();

  const outlets = await Promise.all([
    prisma.outlet.create({
      data: {
        name: "Nashi Katsu — Malioboro",
        phone: "0812-1000-0001",
        address: "Jl. Malioboro No. 21, Yogyakarta",
        latitude: -7.7925,
        longitude: 110.3656,
        isActive: true,
      },
    }),
    prisma.outlet.create({
      data: {
        name: "Nashi Katsu — Seturan",
        phone: "0812-1000-0002",
        address: "Jl. Seturan Raya No. 8, Sleman",
        latitude: -7.7702,
        longitude: 110.4045,
        isActive: true,
      },
    }),
  ]);

  // QRIS per outlet
  for (const o of outlets) {
    await prisma.outletPayment.create({
      data: { outletId: o.id, qrisImage: qrisSvg(o.name), ownerName: "NASHI KATSU FOOD", notes: "QRIS statis — transfer nominal persis lalu upload bukti." },
    });
  }

  // Menus for both outlets
  for (const o of outlets) {
    await prisma.menu.createMany({
      data: MENU.map((m) => ({
        outletId: o.id,
        name: m.name,
        category: m.category,
        description: m.desc,
        price: m.price,
        image: m.image,
        isAvailable: true,
      })),
    });
  }

  const pass = (p: string) => bcrypt.hashSync(p, 10);

  await prisma.user.create({
    data: { name: "Owner Nashi", email: "owner@nashi.id", password: pass("owner123"), role: "OWNER" },
  });
  const cashier1 = await prisma.user.create({
    data: { name: "Kasir Malioboro", email: "kasir1@nashi.id", password: pass("kasir123"), role: "CASHIER", outletId: outlets[0].id },
  });
  await prisma.user.create({
    data: { name: "Kasir Seturan", email: "kasir2@nashi.id", password: pass("kasir123"), role: "CASHIER", outletId: outlets[1].id },
  });

  // Demo conversation + a live queued order for dashboard liveliness
  const menus0 = await prisma.menu.findMany({ where: { outletId: outlets[0].id } });
  const pick = (name: string) => menus0.find((m) => m.name === name)!;

  const conv = await prisma.conversation.create({
    data: {
      outletId: outlets[0].id,
      buyerName: "Sakura",
      buyerPhone: "0857-2222-1111",
      status: "OPEN",
      lastMessage: "Pesenan aku udah masuk antrian ya kak?",
      messages: {
        create: [
          { sender: "buyer", type: "text", content: "Halo kak, masih buka?" },
          { sender: "cashier", type: "text", content: "Halo Sakura! Masih buka sampai jam 22.00 🌸 Mau pesan apa?" },
          { sender: "buyer", type: "text", content: "Mau Katsu Curry Donburi 2, sama Takoyaki 1 ya" },
          { sender: "cashier", type: "text", content: "Siap! Aku buatkan ordernya ya 🙏" },
          { sender: "buyer", type: "text", content: "Pesenan aku udah masuk antrian ya kak?" },
        ],
      },
    },
  });

  const item1 = pick("Chic / Dori Katsu Curry Donburi");
  const item2 = pick("Takoyaki Ball");
  const sub = item1.price * 2 + item2.price;
  const order = await prisma.order.create({
    data: {
      invoiceNumber: "NK-" + Date.now().toString().slice(-6),
      conversationId: conv.id,
      outletId: outlets[0].id,
      cashierId: cashier1.id,
      buyerName: "Sakura",
      buyerPhone: "0857-2222-1111",
      orderType: "TAKEAWAY",
      subtotal: sub,
      tax: 0,
      total: sub,
      status: "QUEUED",
      items: {
        create: [
          { menuId: item1.id, menuName: item1.name, qty: 2, price: item1.price, subtotal: item1.price * 2 },
          { menuId: item2.id, menuName: item2.name, qty: 1, price: item2.price, subtotal: item2.price },
        ],
      },
      payment: { create: { method: "QRIS", amount: sub, status: "PAID", verifiedBy: cashier1.id, verifiedAt: new Date() } },
    },
  });

  // a couple more historical completed orders for finance charts
  for (let i = 0; i < 6; i++) {
    const m = menus0[i % menus0.length];
    const qty = (i % 3) + 1;
    const s = m.price * qty;
    const d = new Date();
    d.setDate(d.getDate() - i);
    await prisma.order.create({
      data: {
        invoiceNumber: "NK-H" + (100 + i),
        outletId: outlets[i % 2].id,
        cashierId: cashier1.id,
        buyerName: ["Yuki", "Hiro", "Rara", "Budi", "Mei", "Tono"][i],
        buyerPhone: "08" + (100000000 + i),
        orderType: i % 2 === 0 ? "TAKEAWAY" : "DELIVERY",
        deliveryAddress: i % 2 === 0 ? null : "Jl. Kaliurang KM 5",
        subtotal: s,
        deliveryFee: i % 2 === 0 ? 0 : 8000,
        total: s + (i % 2 === 0 ? 0 : 8000),
        status: "COMPLETED",
        createdAt: d,
        items: { create: [{ menuId: m.id, menuName: m.name, qty, price: m.price, subtotal: s }] },
        payment: { create: { method: "QRIS", amount: s, status: "PAID", verifiedAt: d } },
      },
    });
  }

  console.log("✅ Seed done.");
  console.log("   Owner  : owner@nashi.id / owner123");
  console.log("   Kasir 1: kasir1@nashi.id / kasir123 (Malioboro)");
  console.log("   Kasir 2: kasir2@nashi.id / kasir123 (Seturan)");
  console.log("   Buyer chat: /o/" + outlets[0].id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
