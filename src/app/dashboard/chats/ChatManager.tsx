"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  IconSearch, IconChat, IconCamera, IconSend, IconChevronLeft,
  IconWhatsApp, IconPlus, IconReceipt, IconChevronRight,
} from "@/components/icons";
import { usePoll } from "@/lib/hooks";
import { uploadImage } from "@/lib/upload";
import { MessageBubble, DateDivider, Msg } from "@/components/chat";
import { rupiah, timeAgo, ORDER_STATUS } from "@/lib/format";
import OrderComposer from "./OrderComposer";

type Conv = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  status: string;
  lastMessage: string | null;
  updatedAt: string;
  outlet: { name: string };
  orders: { id: string; status: string }[];
};

type ActiveConv = {
  conversation: {
    id: string;
    buyerName: string;
    buyerPhone: string;
    status: string;
    outlet: { id: string; name: string; phone: string; address: string };
    messages: Msg[];
    orders: { id: string; invoiceNumber: string; status: string; total: number; orderType: string }[];
  };
};

const QUICK = [
  "Halo, ada yang bisa dibantu?",
  "Baik, pesanan dicatat ya!",
  "Sudah kami terima, mohon ditunggu.",
  "Pesanan sedang disiapkan.",
  "Terima kasih sudah order di Nashi Katsu!",
];

const shortOutlet = (name: string) => name.replace("Nashi Katsu — ", "");
const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`;

/** Stable per-person avatar colour, so the same buyer always looks the same. */
const AVATAR = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];
function avatarTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR[h % AVATAR.length];
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={clsx("grid shrink-0 place-items-center rounded-full font-semibold", avatarTone(name), className ?? "h-10 w-10 text-sm")}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function ChatManager({ role }: { role: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("id");
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<"all" | "waiting">("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [sendingImg, setSendingImg] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: listData } = usePoll<{ conversations: Conv[] }>(`/api/conversations?q=${encodeURIComponent(q)}`, 3500);
  const { data: activeData, reload } = usePoll<ActiveConv>(selected ? `/api/chat/${selected}` : null, 2500);

  const conversations = useMemo(() => listData?.conversations ?? [], [listData]);
  const active = activeData?.conversation;

  const waitingCount = conversations.filter((c) => c.status === "WAITING").length;
  const shown = filter === "waiting" ? conversations.filter((c) => c.status === "WAITING") : conversations;

  // Auto-buka percakapan pertama hanya sekali saat halaman pertama kali dimuat —
  // tidak boleh berjalan ulang tiap kali `selected` kosong, atau tombol back jadi tak berefek
  // (balik ke daftar langsung "dibajak" kembali ke percakapan pertama).
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (didAutoSelect.current) return;
    if (selected) { didAutoSelect.current = true; return; }
    if (conversations.length > 0) {
      didAutoSelect.current = true;
      router.replace(`/dashboard/chats?id=${conversations[0].id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, selected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  async function reply(content: string, type: "text" | "image" = "text") {
    if (!content.trim() || !selected) return;
    await fetch(`/api/chat/${selected}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "cashier", type, content }),
    });
    setText("");
    reload();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSendingImg(true);
    try {
      await reply(await uploadImage(file), "image");
    } catch (er) {
      alert(er instanceof Error ? er.message : "Gagal mengunggah gambar.");
    } finally {
      setSendingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const latestOrder = active?.orders?.[0];

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex bg-gray-3">
      {/* ---------------- LIST ---------------- */}
      <div className={clsx("w-full lg:w-[350px] shrink-0 border-r border-gray-4 bg-white flex flex-col", selected && "hidden lg:flex")}>
        <div className="px-4 pt-4 pb-3 border-b border-gray-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-dark-1 tracking-tight">Chat</h1>
            {waitingCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                {waitingCount} baru
              </span>
            )}
          </div>

          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama atau nomor…"
              className="w-full rounded-lg border border-gray-6 bg-white pl-9 pr-3 py-2.5 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* filter — makes "what still needs a reply" a first-class view */}
          <div className="mt-3 flex gap-1 rounded-lg bg-gray-3 p-1">
            {([["all", `Semua (${conversations.length})`], ["waiting", `Perlu Dibalas (${waitingCount})`]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={clsx(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition",
                  filter === key ? "bg-white text-dark-1 shadow-sm" : "text-gray-5 hover:text-dark-2"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin">
          {shown.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-3 text-gray-2">
                <IconChat className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-dark-2">
                {filter === "waiting" ? "Semua chat sudah dibalas" : "Belum ada percakapan"}
              </p>
            </div>
          )}

          {shown.map((c) => {
            const order = c.orders[0];
            const st = order ? ORDER_STATUS[order.status] : null;
            const isActive = selected === c.id;
            const waiting = c.status === "WAITING";
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/chats?id=${c.id}`)}
                className={clsx(
                  "relative w-full text-left px-4 py-3 border-b border-gray-4 transition flex gap-3",
                  isActive ? "bg-primary-light" : "hover:bg-gray-3"
                )}
              >
                {isActive && <span className="absolute left-0 top-0 h-full w-0.5 bg-primary" />}
                <Avatar name={c.buyerName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={clsx("truncate text-sm", waiting ? "font-semibold text-dark-1" : "font-medium text-dark-2")}>
                      {c.buyerName}
                    </p>
                    <span className="shrink-0 text-[11px] text-gray-2">{timeAgo(c.updatedAt)}</span>
                  </div>
                  <p className={clsx("mt-0.5 truncate text-xs", waiting ? "font-medium text-dark-2" : "text-gray-5")}>
                    {c.lastMessage ?? "—"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {waiting && (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">Perlu dibalas</span>
                    )}
                    {st && (
                      <span className="rounded bg-gray-3 px-1.5 py-0.5 text-[10px] font-medium text-gray-8">{st.label}</span>
                    )}
                    {role === "OWNER" && (
                      <span className="truncate text-[10px] text-gray-2">{shortOutlet(c.outlet.name)}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- ACTIVE THREAD ---------------- */}
      <div className={clsx("flex-1 flex-col min-w-0", selected ? "flex" : "hidden lg:flex")}>
        {!active ? (
          <div className="flex-1 grid place-items-center p-8 text-center">
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white border border-gray-6 text-gray-2">
                <IconChat className="h-7 w-7" />
              </div>
              <p className="text-base font-semibold text-dark-2">Pilih percakapan</p>
              <p className="mt-1 text-sm text-gray-5">Balas chat pembeli &amp; buat order dari sini.</p>
            </div>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="shrink-0 bg-white border-b border-gray-4 px-3 lg:px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/chats")}
                aria-label="Kembali ke daftar"
                className="lg:hidden grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-8 hover:bg-gray-3"
              >
                <IconChevronLeft className="h-5 w-5" />
              </button>

              <Avatar name={active.buyerName} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-dark-1">{active.buyerName}</p>
                <p className="truncate text-xs text-gray-5">
                  {active.buyerPhone} · {shortOutlet(active.outlet.name)}
                </p>
              </div>

              <a
                href={waLink(active.buyerPhone)}
                target="_blank"
                rel="noreferrer"
                title="Hubungi via WhatsApp"
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-4 px-3 text-sm font-semibold text-gray-8 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <IconWhatsApp className="h-4 w-4" />
                WhatsApp
              </a>

              <button
                onClick={() => setComposerOpen(true)}
                className="btn-press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition"
              >
                <IconPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Buat</span> Order
              </button>
            </div>

            {/* active order — now a link, not a dead strip */}
            {latestOrder && (
              <Link
                href={`/dashboard/orders?id=${latestOrder.id}`}
                className="group shrink-0 flex items-center gap-3 border-b border-gray-4 bg-white px-4 py-2.5 hover:bg-gray-3 transition"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                  <IconReceipt className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark-1">
                    {latestOrder.invoiceNumber} · {rupiah(latestOrder.total)}
                  </p>
                  <p className="text-xs text-gray-5">{ORDER_STATUS[latestOrder.status]?.label ?? latestOrder.status}</p>
                </div>
                <IconChevronRight className="h-4 w-4 shrink-0 text-gray-2 group-hover:text-primary transition" />
              </Link>
            )}

            {/* messages */}
            <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4">
              {active.messages.map((m, i) => {
                const prev = active.messages[i - 1];
                const newDay =
                  !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                return (
                  <div key={m.id}>
                    {newDay && <DateDivider date={m.createdAt} />}
                    <MessageBubble m={m} mine={m.sender === "cashier"} />
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* composer */}
            <div className="shrink-0 border-t border-gray-4 bg-white px-3 py-3">
              {/* quick replies only while the field is empty, so they never fight the draft */}
              {!text.trim() && (
                <div className="mb-2 flex gap-2 overflow-x-auto no-scrollbar">
                  {QUICK.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => reply(qr)}
                      title={qr}
                      className="shrink-0 rounded-full border border-gray-4 px-3 py-1.5 text-xs font-medium text-gray-8 hover:border-primary hover:bg-primary-light hover:text-primary transition"
                    >
                      {qr.length > 32 ? qr.slice(0, 32) + "…" : qr}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  aria-label="Kirim foto"
                  disabled={sendingImg}
                  className="btn-press grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gray-6 bg-white text-gray-8 hover:bg-gray-3 transition disabled:opacity-50"
                >
                  <IconCamera className="h-5 w-5" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      reply(text);
                    }
                  }}
                  rows={1}
                  placeholder="Tulis balasan…"
                  className="max-h-28 flex-1 resize-none rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <button
                  onClick={() => reply(text)}
                  disabled={!text.trim()}
                  aria-label="Kirim"
                  className="btn-press grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-white shadow-sm hover:bg-primary-hover transition disabled:bg-gray-4 disabled:text-gray-2 disabled:shadow-none"
                >
                  <IconSend className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-1.5 hidden pl-1 text-[11px] text-gray-2 sm:block">
                Enter untuk kirim · Shift + Enter untuk baris baru
              </p>
            </div>
          </>
        )}
      </div>

      {composerOpen && active && (
        <OrderComposer
          conversationId={active.id}
          outletId={active.outlet.id}
          buyerName={active.buyerName}
          onClose={() => setComposerOpen(false)}
          onCreated={() => {
            setComposerOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
