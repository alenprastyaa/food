"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePoll } from "@/lib/hooks";
import { uploadImage } from "@/lib/upload";
import { MessageBubble, OrderLinkCard, Msg } from "@/components/chat";
import { Logo } from "@/components/ui";

type ConvData = {
  conversation: {
    id: string;
    status: string;
    outlet: { name: string; phone: string };
    messages: Msg[];
    orders: { id: string; invoiceNumber: string; status: string; total: number; orderType: string }[];
  };
};

export default function BuyerChat({ conversationId, outletName, buyerName }: { conversationId: string; outletName: string; buyerName: string }) {
  const { data, reload } = usePoll<ConvData>(`/api/chat/${conversationId}`, 2500);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingImg, setSendingImg] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const conv = data?.conversation;
  const messages = conv?.messages ?? [];
  const latestOrder = conv?.orders?.[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(content: string, type: "text" | "image" = "text") {
    if (!content.trim()) return;
    setSending(true);
    await fetch(`/api/chat/${conversationId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "buyer", type, content }),
    });
    setText("");
    setSending(false);
    reload();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSendingImg(true);
    try {
      await send(await uploadImage(file), "image");
    } catch (er) {
      alert(er instanceof Error ? er.message : "Gagal mengunggah gambar.");
    } finally {
      setSendingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-asanoha flex flex-col max-w-2xl mx-auto">
      {/* header */}
      <header className="sticky top-0 z-20 bg-sumi text-washi">
        <div className="noren h-1.5 w-full" />
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href={`/`} className="text-washi/70 hover:text-washi text-xl">‹</Link>
          <span className="hanko h-9 w-9 text-base">🏪</span>
          <div className="min-w-0 flex-1">
            <p className="font-round font-semibold text-sm truncate">{outletName}</p>
            <p className="text-[11px] text-emerald-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Kasir online
            </p>
          </div>
          <span className="text-[11px] text-washi/50 font-display">{buyerName}</span>
        </div>
      </header>

      {/* messages */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} mine={m.sender === "buyer"} />
        ))}

        {/* order card appears in the flow */}
        {latestOrder && (
          <OrderLinkCard
            order={latestOrder}
            href={`/order/${latestOrder.id}`}
            cta={
              latestOrder.status === "DRAFT" || latestOrder.status === "WAITING_CONFIRMATION"
                ? "Review & Konfirmasi"
                : ["WAITING_PAYMENT", "WAITING_PAYMENT_VERIFICATION"].includes(latestOrder.status)
                ? "Bayar Sekarang"
                : "Lihat Status"
            }
          />
        )}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="sticky bottom-0 bg-washi/90 backdrop-blur border-t border-sumi/10 p-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="shrink-0 h-11 w-11 grid place-items-center rounded-xl bg-paper ring-1 ring-sumi/10 text-lg btn-press"
            title="Kirim gambar"
          >
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={1}
            placeholder="Tulis pesan…"
            className="flex-1 resize-none rounded-xl border border-sumi/15 bg-paper px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20 max-h-28"
          />
          <button
            onClick={() => send(text)}
            disabled={sending || !text.trim()}
            className="shrink-0 h-11 w-11 grid place-items-center rounded-xl bg-shu text-white text-lg shadow-[0_3px_0_var(--color-shu-dark)] btn-press disabled:opacity-40"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
