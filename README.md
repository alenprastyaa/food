# 梨 Nashi Katsu — Chat-Based Food Ordering

> サクサク・ジューシー・やみつき — Sistem pemesanan makanan berbasis **chat** dengan tema Jepang (washi, seigaiha, hanko, vermillion).

Full-stack MVP dari [`spec.md`](./spec.md): pembeli mengobrol dengan kasir, kasir membuat order, sistem menghasilkan **Order Link**, pembeli memilih Take Away / Delivery, membayar via **QRIS statis**, mengunggah bukti, kasir memverifikasi, lalu order masuk **antrian dapur**. Mendukung **multi-outlet** dengan peran **Owner** & **Cashier**.

---

## 🚀 Menjalankan

```bash
npm install
npm run db:reset   # push schema + seed data demo (Nashi Katsu menu, 2 outlet, akun)
npm run dev        # http://localhost:3000
```

> `db:reset` sudah otomatis dijalankan? Cukup `npm run dev`. Untuk seed ulang: `npm run seed`.

### Akun Demo

| Peran | Email | Password | Akses |
|-------|-------|----------|-------|
| **Owner** | `owner@nashi.id` | `owner123` | Semua outlet, kelola menu/outlet/kasir/QRIS, finance |
| **Kasir Malioboro** | `kasir1@nashi.id` | `kasir123` | Hanya outlet Malioboro |
| **Kasir Seturan** | `kasir2@nashi.id` | `kasir123` | Hanya outlet Seturan |

**Pembeli tidak perlu login.** Dari landing page (`/`) → pilih outlet → mulai chat.

---

## 🧭 Alur Utama (Golden Path)

```
Buyer buka /o/[outlet] → isi nama/HP → Chat dengan kasir
   → Kasir "+ Order" (pilih menu, qty, catatan, diskon)
   → Order Link muncul di chat → Buyer buka
   → Pilih Take Away / Delivery (Delivery wajib GPS + alamat)
   → Bayar QRIS → Upload bukti
   → Kasir verifikasi (Approve/Reject)
   → QUEUED → COOKING → READY → COMPLETED (papan antrian dapur)
```

Status buyer & kasir tersinkron **realtime** (polling ~2.5s; chat, order, antrian).

---

## 🗺️ Peta Halaman

**Publik (buyer, tanpa login)**
- `/` — landing bertema Jepang + daftar outlet
- `/o/[outletId]` — profil outlet, browse menu, mulai chat
- `/chat/[conversationId]` — ruang chat pembeli
- `/order/[orderId]` — Order Link: review → tipe → bayar QRIS → lacak status

**Dashboard (Owner / Cashier)**
- `/login`
- `/dashboard` — widget live (chat aktif, order, antrian, revenue); Owner + analitik (revenue per outlet, menu terlaris, grafik 30 hari)
- `/dashboard/chats` — daftar chat + balas + quick reply + **buat order**
- `/dashboard/orders` — kelola order + **verifikasi pembayaran** (lihat bukti, approve/reject)
- `/dashboard/queue` — papan antrian dapur (kanban: Antrian → Dimasak → Siap → Selesai)
- `/dashboard/finance` — laporan (revenue, order, dibatalkan, rata-rata) + filter hari/minggu/bulan/outlet
- `/dashboard/menu` · `/dashboard/outlets` · `/dashboard/cashiers` · `/dashboard/qris` — **khusus Owner**

---

## 🏗️ Arsitektur

- **Next.js 15** (App Router, Route Handlers, Server Components)
- **Prisma + SQLite** — semua entity dari spec (Outlet, User, Menu, Conversation, Message, Order, OrderItem, Payment, OutletPayment)
- **Auth**: JWT (`jose`) di cookie httpOnly + `middleware.ts` untuk RBAC (dashboard & area owner-only)
- **TailwindCSS v4** — design system Jepang di [`globals.css`](./src/app/globals.css)
- **Fonts self-hosted** (Shippori Mincho, Zen Maru Gothic, Plus Jakarta Sans) — di `src/fonts/`, tanpa dependensi jaringan runtime
- **Realtime**: polling ringan (`usePoll`) untuk chat, order, antrian, dashboard
- Scoping data per-outlet (kasir hanya outletnya, owner semua) di [`src/lib/scope.ts`](./src/lib/scope.ts)

### RBAC ringkas

| Fitur | Buyer | Cashier | Owner |
|-------|:-----:|:-------:|:-----:|
| Chat | ✅ | ✅ | ✅ |
| Buat Order | ❌ | ✅ | ✅ |
| Verifikasi Bayar | ❌ | ✅ | ✅ |
| Antrian | ❌ | ✅ | ✅ |
| Kelola Menu/Outlet/Kasir/QRIS | ❌ | ❌ | ✅ |
| Finance | ❌ | Outlet sendiri | Semua outlet |

---

## 🎨 Tema

Terinspirasi poster menu Nashi Katsu: kertas *washi* krem, merah *shu* (vermillion) dengan label harga bergaya menu, pola gelombang *seigaiha* & *asanoha*, stempel *hanko* (梨), aksen katakana, kelopak sakura berjatuhan, dan kurva noren di header.

> Catatan: pembayaran memakai **QRIS statis** (gambar di-generate untuk demo). Tanpa payment gateway — sesuai spec.
