"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { usePoll, fileToDataUrl } from "@/lib/hooks";
import { MessageBubble, Msg } from "@/components/chat";
import { rupiah, timeAgo, ORDER_STATUS } from "@/lib/format";
import { Button } from "@/components/ui";
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
  "Halo, ada yang bisa dibantu? 🌸",
  "Menu favorit hari ini: Katsu Curry Donburi 🍛",
  "Baik, pesanan dicatat ya!",
  "Sudah kami terima, mohon ditunggu 🙏",
  "Terima kasih sudah order di Nashi Katsu!",
];

export default function ChatManager({ role }: { role: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("id");
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: listData } = usePoll<{ conversations: Conv[] }>(`/api/conversations?q=${encodeURIComponent(q)}`, 3500);
  const { data: activeData, reload } = usePoll<ActiveConv>(selected ? `/api/chat/${selected}` : null, 2500);

  const conversations = listData?.conversations ?? [];
  const active = activeData?.conversation;

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
    const url = await fileToDataUrl(file);
    await reply(url, "image");
    if (fileRef.current) fileRef.current.value = "";
  }

  const latestOrder = active?.orders?.[0];

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      {/* LIST */}
      <div className={clsx("w-full lg:w-[340px] shrink-0 border-r border-sumi/10 bg-paper flex flex-col", selected && "hidden lg:flex")}>
        <div className="p-4 border-b border-sumi/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xl font-extrabold">Chat <span className="font-round text-shu/60 text-sm">会話</span></h1>
            <span className="text-xs bg-shu/10 text-shu rounded-full px-2 py-1 font-bold">{conversations.length}</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sumi/30 text-sm">🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / nomor…"
              className="w-full rounded-xl border border-sumi/15 bg-washi/50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin">
          {conversations.length === 0 && <p className="text-center text-sm text-sumi/40 py-10">Belum ada percakapan.</p>}
          {conversations.map((c) => {
            const order = c.orders[0];
            const st = order ? ORDER_STATUS[order.status] : null;
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/chats?id=${c.id}`)}
                className={clsx(
                  "w-full text-left px-4 py-3 border-b border-sumi/5 hover:bg-washi/60 transition flex gap-3",
                  selected === c.id && "bg-shu/5 border-l-2 border-l-shu"
                )}
              >
                <span className="hanko h-10 w-10 text-sm shrink-0">{c.buyerName.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-round font-bold text-sm text-sumi truncate">{c.buyerName}</p>
                    <span className="text-[10px] text-sumi/40 shrink-0">{timeAgo(c.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-sumi/50 truncate mt-0.5">{c.lastMessage}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {role === "OWNER" && <span className="text-[10px] text-sumi/40">{c.outlet.name.replace("Nashi Katsu — ", "")}</span>}
                    {st && <span className="text-[10px] font-bold text-shu bg-shu/10 rounded px-1.5 py-0.5">{st.label}</span>}
                    {c.status === "WAITING" && <span className="h-2 w-2 rounded-full bg-shu pulse-ring" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE */}
      <div className={clsx("flex-1 flex-col bg-asanoha min-w-0", selected ? "flex" : "hidden lg:flex")}>
        {!active ? (
          <div className="flex-1 grid place-items-center text-center p-8">
            <div>
              <div className="hanko h-16 w-16 text-3xl mx-auto mb-3">会</div>
              <p className="font-display text-lg font-bold text-sumi/60">Pilih percakapan</p>
              <p className="text-sm text-sumi/40">Balas chat pembeli & buat order dari sini.</p>
            </div>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="bg-paper border-b border-sumi/10 px-4 py-3 flex items-center gap-3">
              <button onClick={() => router.push("/dashboard/chats")} className="lg:hidden text-xl text-sumi/60">‹</button>
              <span className="hanko h-10 w-10 text-sm shrink-0">{active.buyerName.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-round font-bold text-sm truncate">{active.buyerName}</p>
                <p className="text-xs text-sumi/50">{active.buyerPhone} · {active.outlet.name.replace("Nashi Katsu — ", "")}</p>
              </div>
              <a
                href={`https://wa.me/${active.buyerPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                target="_blank"
                className="text-sm px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 font-round font-bold btn-press hidden sm:inline-flex"
              >
                WA
              </a>
              <Button onClick={() => setComposerOpen(true)} className="py-2">+ Order</Button>
            </div>

            {/* order banner */}
            {latestOrder && (
              <div className="bg-sumi text-washi px-4 py-2 flex items-center justify-between text-sm">
                <span className="font-round">🧾 {latestOrder.invoiceNumber} · {rupiah(latestOrder.total)}</span>
                <span className="font-display text-kin-light text-xs">{ORDER_STATUS[latestOrder.status]?.label}</span>
              </div>
            )}

            {/* messages */}
            <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4">
              {active.messages.map((m) => (
                <MessageBubble key={m.id} m={m} mine={m.sender === "cashier"} />
              ))}
              <div ref={endRef} />
            </div>

            {/* quick replies */}
            <div className="px-3 pt-2 flex gap-2 overflow-x-auto scroll-thin">
              {QUICK.map((qr) => (
                <button
                  key={qr}
                  onClick={() => reply(qr)}
                  className="shrink-0 text-xs rounded-full bg-paper ring-1 ring-sumi/10 px-3 py-1.5 text-sumi/70 hover:bg-shu/5 hover:text-shu transition"
                >
                  {qr.length > 30 ? qr.slice(0, 30) + "…" : qr}
                </button>
              ))}
            </div>

            {/* composer */}
            <div className="p-3 bg-paper/60 backdrop-blur border-t border-sumi/10">
              <div className="flex items-end gap-2">
                <button onClick={() => fileRef.current?.click()} className="shrink-0 h-11 w-11 grid place-items-center rounded-xl bg-paper ring-1 ring-sumi/10 text-lg btn-press">📷</button>
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
                  placeholder="Balas pesan…"
                  className="flex-1 resize-none rounded-xl border border-sumi/15 bg-paper px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20 max-h-28"
                />
                <button onClick={() => reply(text)} disabled={!text.trim()} className="shrink-0 h-11 w-11 grid place-items-center rounded-xl bg-shu text-white text-lg shadow-[0_3px_0_var(--color-shu-dark)] btn-press disabled:opacity-40">➤</button>
              </div>
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
