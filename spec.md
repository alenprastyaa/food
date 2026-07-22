# Food Ordering System (Chat-Based)
## Product Specification (MVP)

---

# Overview

Food Ordering System adalah aplikasi pemesanan makanan berbasis **chat**.

Berbeda dengan marketplace makanan, proses pemesanan dimulai dari percakapan antara pembeli dan kasir. Setelah pesanan disepakati, kasir membuat order dan sistem menghasilkan **Order Link** yang dibuka oleh pembeli untuk melakukan konfirmasi serta pembayaran.

Sistem mendukung banyak outlet (Multi Outlet) dalam satu bisnis.

---

# Goals

- Pemesanan lebih personal melalui chat.
- Kasir dapat membuat order dari hasil percakapan.
- Owner dapat mengelola seluruh outlet.
- Pembayaran menggunakan QRIS statis milik outlet.
- Mendukung Take Away dan Delivery.
- Memiliki sistem antrian yang mudah dipantau.

---

# User Roles

## Buyer

Buyer tidak perlu login.

### Permissions

- Memulai chat
- Mengirim pesan
- Menerima balasan kasir
- Membuka Order Link
- Memilih tipe pesanan
- Melakukan pembayaran
- Upload bukti pembayaran
- Melihat status order

---

## Cashier

Kasir hanya memiliki akses ke outlet miliknya.

### Permissions

- Login Dashboard
- Melihat chat
- Membalas chat
- Membuat Order
- Mengelola Order
- Verifikasi pembayaran
- Mengubah status order
- Melihat antrian outlet

---

## Owner

Owner memiliki akses penuh.

### Permissions

- Kelola Outlet
- Kelola Menu
- Kelola Kasir
- Kelola QRIS
- Dashboard seluruh outlet
- Laporan keuangan
- Melihat seluruh order

---

# Main Flow

Buyer

↓

Mulai Chat

↓

Kasir menerima chat

↓

Diskusi pesanan

↓

Kasir membuat Order

↓

Generate Order Link

↓

Buyer membuka link

↓

Review pesanan

↓

Pilih Take Away / Delivery

↓

(Pilih Delivery → wajib mengaktifkan lokasi)

↓

Pembayaran QRIS

↓

Upload bukti pembayaran

↓

Kasir verifikasi

↓

Masuk Antrian

↓

Cooking

↓

Ready

↓

Completed

---

# Modules

## Authentication

Login hanya tersedia untuk:

- Owner
- Cashier

Buyer tidak login.

---

# Chat Module

Chat menjadi awal seluruh proses.

### Features

Buyer

- Kirim pesan
- Kirim gambar (opsional)
- Menerima balasan

Cashier

- Daftar chat
- Realtime chat
- Quick Reply
- Search chat
- Histori chat
- Generate Order

---

# Conversation Entity

```text
Conversation

id
outlet_id

buyer_name
buyer_phone

status

OPEN
WAITING
CLOSED

last_message

created_at
updated_at
```

---

# Message Entity

```text
Message

id
conversation_id

sender

buyer
cashier

type

text
image
system

content

created_at
```

---

# Order Module

Kasir membuat order dari hasil chat.

---

## Order Status

```text
DRAFT

WAITING_CONFIRMATION

WAITING_PAYMENT

WAITING_PAYMENT_VERIFICATION

PAID

QUEUED

COOKING

READY

COMPLETED

CANCELLED
```

---

# Order Entity

```text
Order

id

invoice_number

conversation_id

outlet_id

cashier_id

buyer_name

buyer_phone

order_type

TAKEAWAY
DELIVERY

delivery_address

latitude

longitude

subtotal

discount

tax

delivery_fee

total

status

created_at
```

---

# Order Item

```text
OrderItem

id

order_id

menu_id

menu_name

qty

price

subtotal

notes
```

---

# Menu Module

Owner mengelola seluruh menu.

Kasir hanya dapat melihat menu.

---

# Menu Entity

```text
Menu

id

outlet_id

name

category

description

price

image

is_available
```

---

# Outlet Module

Owner dapat membuat banyak outlet.

Setiap outlet memiliki:

- Menu sendiri
- Kasir sendiri
- QRIS sendiri
- Antrian sendiri
- Order sendiri

---

# Outlet Entity

```text
Outlet

id

name

phone

address

latitude

longitude

is_active
```

---

# QRIS Module

Setiap outlet menggunakan QRIS statis.

Tidak menggunakan Payment Gateway.

Owner mengunggah QRIS secara manual.

---

# QRIS Entity

```text
OutletPayment

id

outlet_id

qris_image

owner_name

notes

updated_at
```

---

# Payment Module

Pembayaran dilakukan secara manual.

Flow

Buyer

↓

Scan QRIS

↓

Bayar

↓

Upload Bukti

↓

Kasir Verifikasi

↓

Approve / Reject

---

# Payment Status

```text
UNPAID

WAITING_VERIFICATION

PAID

REJECTED
```

---

# Payment Entity

```text
Payment

id

order_id

method

QRIS

amount

proof_image

status

verified_by

verified_at

notes
```

---

# Delivery Module

Buyer memilih:

## Take Away

- Tidak membutuhkan lokasi.

## Delivery

Buyer wajib:

- Mengaktifkan lokasi.
- Memberikan izin GPS.
- Mengisi alamat.

Kasir dapat membuka lokasi menggunakan Google Maps.

---

# Queue Module

Setelah pembayaran berhasil diverifikasi.

Order otomatis masuk antrian.

Status

```text
QUEUED

COOKING

READY

COMPLETED
```

Kasir dapat mengubah status secara manual.

---

# Dashboard Cashier

Kasir hanya melihat outlet sendiri.

Widget

- Chat Aktif
- Order Baru
- Waiting Payment
- Waiting Verification
- Queue
- Cooking
- Ready
- Revenue Hari Ini

---

# Dashboard Owner

Owner melihat seluruh outlet.

Widget

- Revenue Semua Outlet
- Revenue per Outlet
- Total Order
- Total Chat
- Menu Terlaris
- Outlet Terlaris
- Outlet Teramai
- Order Hari Ini
- Monthly Revenue

---

# Finance Module

Owner

- Semua outlet

Kasir

- Outlet sendiri

Laporan

- Revenue
- Order
- Cancelled
- Payment
- Average Order

Filter

- Hari
- Minggu
- Bulan
- Outlet

---

# Notification

Buyer

- Chat baru
- Order dibuat
- Pembayaran diterima
- Order diproses
- Order selesai

Kasir

- Chat baru
- Order dikonfirmasi
- Bukti pembayaran diupload

Owner

- Revenue harian
- Laporan outlet

---

# Permission Matrix

| Feature | Buyer | Cashier | Owner |
|----------|--------|----------|--------|
| Chat | ✅ | ✅ | ✅ |
| Create Order | ❌ | ✅ | ✅ |
| View Menu | ✅ | ✅ | ✅ |
| Manage Menu | ❌ | ❌ | ✅ |
| Manage Outlet | ❌ | ❌ | ✅ |
| Upload QRIS | ❌ | ❌ | ✅ |
| Verify Payment | ❌ | ✅ | ✅ |
| Queue Management | ❌ | ✅ | ✅ |
| Finance | ❌ | Outlet Sendiri | Semua Outlet |

---

# Non Functional Requirements

## Performance

- Chat realtime (<500ms)
- Dashboard <2 detik
- Mendukung minimal 100 order aktif per outlet
- Mendukung multi outlet

## Security

- JWT Authentication
- Role-Based Access Control (RBAC)
- HTTPS
- Audit Log
- Rate Limiting

## Scalability

- Multi Tenant
- Multi Outlet
- Horizontal Scaling
- WebSocket untuk chat & update order realtime

---

# Future Features (Out of Scope v1)

- Payment Gateway (Midtrans/Xendit)
- QRIS Dinamis
- Promo & Voucher
- Loyalty Program
- Kitchen Display System (KDS)
- Thermal Printer
- Inventory Management
- Customer Membership
- AI Auto Reply
- Integrasi GoFood/GrabFood