import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/scope";
import PrintToolbar from "./PrintToolbar";

export const dynamic = "force-dynamic";

export default async function PrintLabelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { options: true } }, outlet: { select: { name: true } }, payment: true },
  });
  if (!order) notFound();
  if (!canAccessOutlet(user, order.outletId)) notFound();

  // one label per physical unit, so the kitchen can stick one per box
  const labels = order.items.flatMap((it) =>
    Array.from({ length: it.qty }, (_, i) => ({ ...it, unitIndex: i + 1 }))
  );

  return (
    <div className="min-h-screen bg-sumi/5 p-4">
      <PrintToolbar />
      <div className="max-w-md mx-auto space-y-3 print:space-y-0 print:max-w-none">
        {labels.map((l, i) => (
          <div
            key={l.id + "-" + l.unitIndex}
            className="label-card bg-white rounded-xl p-3 ring-1 ring-sumi/10 print:rounded-none print:ring-0 print:border-b print:border-dashed print:border-black"
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>{order.invoiceNumber}</span>
              <span>#{i + 1}/{labels.length}</span>
            </div>
            {l.forName && <p className="text-xs font-bold uppercase tracking-wide">👤 {l.forName}</p>}
            <p className="text-sm font-bold mt-1 leading-snug">{l.menuName}</p>
            {l.options.length > 0 && (
              <p className="text-xs mt-0.5">{l.options.map((o) => o.optionName).join(", ")}</p>
            )}
            {l.notes && <p className="text-xs italic mt-0.5">Catatan: {l.notes}</p>}
            <div className="mt-2 pt-2 border-t border-dashed border-sumi/20 flex items-center justify-between text-[11px]">
              <span>{order.orderType === "DELIVERY" ? "🛵 Delivery" : "🥡 Take Away"}</span>
              <span className="font-bold">{order.buyerName}</span>
            </div>
            {order.payment?.method === "COD" && order.payment.status !== "PAID" && (
              <p className="text-xs font-bold mt-1 bg-black text-white text-center py-1 rounded">💵 COD — TAGIH Rp{order.total.toLocaleString("id-ID")}</p>
            )}
            <p className="text-[10px] text-sumi/50 mt-0.5">{order.outlet.name}</p>
          </div>
        ))}
        {labels.length === 0 && <p className="text-center text-sm text-sumi/50">Order ini tidak punya item.</p>}
      </div>

      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 2mm; }
          body { background: #fff; }
          .label-card { page-break-after: always; }
          .label-card:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}
