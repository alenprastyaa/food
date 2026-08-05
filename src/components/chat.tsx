import Link from "next/link";
import clsx from "clsx";
import { clock, rupiah, ORDER_STATUS } from "@/lib/format";

export type Msg = { id: string; sender: string; type: string; content: string; createdAt: string };

/** "Hari ini" / "Kemarin" / "4 Agustus 2026" — anchors long threads. */
export function DateDivider({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const label = sameDay(d, today)
    ? "Hari ini"
    : sameDay(d, yesterday)
      ? "Kemarin"
      : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex justify-center my-4">
      <span className="rounded-full bg-white border border-gray-6 px-3 py-1 text-[11px] font-medium text-gray-5">
        {label}
      </span>
    </div>
  );
}

export function MessageBubble({ m, mine }: { m: Msg; mine: boolean }) {
  if (m.type === "system" || m.sender === "system") {
    return (
      <div className="flex justify-center my-3">
        <span className="max-w-[80%] text-center text-[11px] leading-relaxed text-gray-5 bg-gray-4/60 rounded-lg px-3 py-1.5">
          {m.content}
        </span>
      </div>
    );
  }
  return (
    <div className={clsx("flex mb-2", mine ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-[78%] flex flex-col", mine ? "items-end" : "items-start")}>
        <div
          className={clsx(
            "px-3.5 py-2.5 text-sm leading-relaxed",
            m.type === "image" && "p-1.5",
            mine
              ? "bg-primary text-white rounded-2xl rounded-br-sm"
              : "bg-white text-dark-1 border border-gray-4 rounded-2xl rounded-bl-sm"
          )}
        >
          {m.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.content} alt="lampiran" className="rounded-xl max-h-60 object-cover" />
          ) : (
            <span className="whitespace-pre-wrap break-words">{m.content}</span>
          )}
        </div>
        <span className="text-[10px] text-gray-2 mt-1 px-1 tabular-nums">{clock(m.createdAt)}</span>
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
      <div className="w-full max-w-xs rounded-xl border border-gray-6 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-4 bg-gray-3 px-4 py-2.5">
          <span className="text-xs font-semibold tracking-wide text-dark-2">{order.invoiceNumber}</span>
          <span className="text-[11px] font-medium text-gray-5">{st.label}</span>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-5">{order.orderType === "DELIVERY" ? "Delivery" : "Take Away"}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-dark-1 tabular-nums">{rupiah(order.total)}</p>
          <Link
            href={href}
            className="btn-press mt-3 block rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
