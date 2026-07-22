import Link from "next/link";
import clsx from "clsx";
import { clock, rupiah, ORDER_STATUS } from "@/lib/format";

export type Msg = { id: string; sender: string; type: string; content: string; createdAt: string };

export function MessageBubble({ m, mine }: { m: Msg; mine: boolean }) {
  if (m.type === "system" || m.sender === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-sumi/40 bg-sumi/5 rounded-full px-3 py-1">{m.content}</span>
      </div>
    );
  }
  return (
    <div className={clsx("flex mb-2.5", mine ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-[78%] flex flex-col", mine ? "items-end" : "items-start")}>
        <div
          className={clsx(
            "px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
            mine
              ? "bg-shu text-white rounded-2xl rounded-br-md"
              : "bg-paper text-sumi rounded-2xl rounded-bl-md ring-1 ring-sumi/10"
          )}
        >
          {m.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.content} alt="lampiran" className="rounded-lg max-h-52 object-cover" />
          ) : (
            <span className="whitespace-pre-wrap break-words">{m.content}</span>
          )}
        </div>
        <span className="text-[10px] text-sumi/35 mt-1 px-1">{clock(m.createdAt)}</span>
      </div>
    </div>
  );
}

export function OrderLinkCard({
  order,
  href,
  cta = "Buka & Bayar",
}: {
  order: { invoiceNumber: string; status: string; total: number; orderType: string };
  href: string;
  cta?: string;
}) {
  const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.DRAFT;
  return (
    <div className="flex justify-center my-3">
      <div className="w-full max-w-xs paper-card rounded-2xl overflow-hidden">
        <div className="bg-sumi text-washi px-4 py-2.5 flex items-center justify-between">
          <span className="font-round font-bold text-xs tracking-wide">🧾 {order.invoiceNumber}</span>
          <span className="text-[10px] font-display text-kin-light">{st.jp}</span>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sumi/50">{order.orderType === "DELIVERY" ? "🛵 Delivery" : "🥡 Take Away"}</span>
            <span className="text-xs font-semibold text-sumi/60">{st.label}</span>
          </div>
          <p className="font-display text-2xl font-extrabold text-shu mt-1">{rupiah(order.total)}</p>
          <Link
            href={href}
            className="btn-press mt-3 block text-center rounded-xl bg-shu text-white font-round font-bold text-sm py-2.5 shadow-[0_3px_0_var(--color-shu-dark)]"
          >
            {cta} →
          </Link>
        </div>
      </div>
    </div>
  );
}
