# 梨 Nashi Katsu — Chat-Based Food Ordering

> サクサク・ジューシー・やみつき — Sistem pemesanan makanan bertema Jepang (washi, seigaiha, hanko, vermillion), gaya e-commerce (browse menu → keranjang → checkout) dengan **chat** sebagai kanal komunikasi & dukungan kasir.

Full-stack app berbasis [`spec.md`](./spec.md), dikembangkan lebih jauh: pembeli bisa membuat akun, browse menu dengan foto asli, checkout dari keranjang (order otomatis dibuat + sesi chat terbuka untuk komunikasi dengan kasir), pilih Take Away / Delivery, bayar via **QRIS statis**, unggah bukti, kasir memverifikasi, lalu order masuk **antrian dapur**. Kasir tetap bisa membuat order manual dari chat (misal pesanan telepon). Mendukung **multi-outlet** dengan peran **Buyer**, **Owner**, & **Cashier**.

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

**Buyer bisa checkout sebagai tamu (guest) atau login.** Akun buyer opsional — mempercepat checkout (nama/HP terisi otomatis) & menyimpan riwayat order di `/account`.

---

## 🧭 Alur Utama (Golden Path)

```
Buyer buka /o/[outlet] → browse menu (foto asli) → + Tambah ke keranjang
   → Lihat Keranjang → Checkout (isi/atau otomatis dari akun)
   → Order otomatis dibuat (WAITING_CONFIRMATION) + sesi chat terbuka
   → Buyer diarahkan ke /order/[id]: pilih Take Away / Delivery (Delivery wajib GPS + alamat)
   → Bayar QRIS → Upload bukti
   → Kasir verifikasi (Approve/Reject) — juga bisa chat langsung dgn buyer
   → QUEUED → COOKING → READY → COMPLETED (papan antrian dapur)
```

Kasir juga bisa membuat order **manual** dari halaman Chat (tombol "+ Order") untuk pesanan by telepon/WA — flow lama tetap tersedia berdampingan dengan checkout mandiri.

Status buyer & kasir tersinkron **realtime** (polling ~2.5s; chat, order, antrian).

---

## 🗺️ Peta Halaman

**Publik (buyer)**
- `/` — landing bertema Jepang + daftar outlet
- `/o/[outletId]` — **shop**: browse menu dengan foto asli, keranjang, checkout
- `/account/register`, `/account/login` — akun buyer opsional
- `/account` — riwayat order buyer (butuh login)
- `/chat/[conversationId]` — ruang chat dengan kasir (dibuka otomatis saat checkout, atau via tombol "Tanya Kasir")
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
- **Prisma + SQLite** — semua entity dari spec + `Buyer` (akun pembeli opsional, `buyerId` nullable di Conversation & Order)
- **Dua sistem auth terpisah**: staff (`nashi_session` cookie, role OWNER/CASHIER) & buyer (`nashi_buyer` cookie) — JWT (`jose`), `middleware.ts` untuk RBAC dashboard + area akun buyer
- **TailwindCSS v4** — design system Jepang di [`globals.css`](./src/app/globals.css)
- **Fonts self-hosted** (Shippori Mincho, Zen Maru Gothic, Plus Jakarta Sans) — di `src/fonts/`, tanpa dependensi jaringan runtime
- **Foto menu asli** — 22 foto dari Wikimedia Commons (lisensi bebas) di `public/menu/`, sourced via `scripts/fetch-photos.mjs`; owner bisa unggah foto sendiri lewat Dashboard → Menu
- **Keranjang** disimpan di `localStorage` per-outlet (`src/lib/cart.ts`) — checkout memanggil `/api/orders/checkout` yang langsung membuat Conversation + Order (skip pembuatan manual kasir)
- **Realtime**: polling ringan (`usePoll`) untuk chat, order, antrian, dashboard
- Scoping data per-outlet (kasir hanya outletnya, owner semua) di [`src/lib/scope.ts`](./src/lib/scope.ts)

### RBAC ringkas

| Fitur | Buyer (guest) | Buyer (login) | Cashier | Owner |
|-------|:---:|:---:|:---:|:---:|
| Browse menu & checkout | ✅ | ✅ | — | — |
| Riwayat order (`/account`) | ❌ | ✅ | — | — |
| Chat | ✅ | ✅ | ✅ | ✅ |
| Buat Order manual | ❌ | ❌ | ✅ | ✅ |
| Verifikasi Bayar | ❌ | ❌ | ✅ | ✅ |
| Antrian | ❌ | ❌ | ✅ | ✅ |
| Kelola Menu/Outlet/Kasir/QRIS | ❌ | ❌ | ❌ | ✅ |
| Finance | ❌ | ❌ | Outlet sendiri | Semua outlet |

---

## 🎨 Tema

Terinspirasi poster menu Nashi Katsu: kertas *washi* krem, merah *shu* (vermillion) dengan label harga bergaya menu, pola gelombang *seigaiha* & *asanoha*, stempel *hanko* (梨), aksen katakana, kelopak sakura berjatuhan, dan kurva noren di header.

> Catatan: pembayaran memakai **QRIS statis** (gambar di-generate untuk demo). Tanpa payment gateway — sesuai spec.
