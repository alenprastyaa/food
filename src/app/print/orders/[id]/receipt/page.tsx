import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/scope";
import { rupiah } from "@/lib/format";
import ReceiptToolbar from "./ReceiptToolbar";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { options: true } }, outlet: { select: { name: true, address: true, phone: true } }, payment: true },
  });
  if (!order) notFound();
  if (!canAccessOutlet(user, order.outletId)) notFound();

  const paymentLabel: Record<string, string> = { QRIS: "QRIS", COD: "Bayar di Tempat (COD)", CASH: "Tunai" };

  return (
    <div className="min-h-screen bg-sumi/5 p-4">
      <ReceiptToolbar />
      <div className="max-w-[300px] mx-auto bg-white rounded-xl ring-1 ring-sumi/10 p-4 font-mono text-[12px] leading-snug text-black print:rounded-none print:ring-0 print:p-0">
        <div className="text-center">
          <p className="font-bold text-sm">{order.outlet.name}</p>
          <p>{order.outlet.address}</p>
          <p>{order.outlet.phone}</p>
        </div>
        <div className="border-t border-dashed border-black my-2 pt-2">
          <div className="flex justify-between"><span>{order.invoiceNumber}</span><span>{new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</span></div>
          <div className="flex justify-between"><span>Pembeli</span><span>{order.buyerName}</span></div>
          <div className="flex justify-between"><span>Tipe</span><span>{order.orderType === "DELIVERY" ? "Delivery" : "Take Away"}</span></div>
        </div>

        {order.queueNumber != null && (
          <div className="border-t border-dashed border-black my-2 pt-2 text-center">
            <p className="text-[10px] tracking-widest">NOMOR ANTRIAN</p>
            <p className="font-bold text-3xl leading-none">#{order.queueNumber}</p>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2 pt-2 space-y-1">
          {order.items.map((it) => (
            <div key={it.id}>
              <div className="flex justify-between">
                <span>{it.qty}× {it.menuName}</span>
                <span>{rupiah(it.subtotal)}</span>
              </div>
              {it.forName && <p className="text-[10px]">Untuk: {it.forName}</p>}
              {it.options.length > 0 && <p className="text-[10px]">{it.options.map((o) => o.optionName).join(", ")}</p>}
              {it.notes && <p className="text-[10px] italic">Catatan: {it.notes}</p>}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2 pt-2 space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span>{rupiah(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{rupiah(order.discount)}</span></div>}
          {order.pointsUsed > 0 && <div className="flex justify-between"><span>Poin</span><span>-{rupiah(order.pointsUsed)}</span></div>}
          {order.tax > 0 && <div className="flex justify-between"><span>Pajak</span><span>{rupiah(order.tax)}</span></div>}
          {order.deliveryFee > 0 && <div className="flex justify-between"><span>Ongkir</span><span>{rupiah(order.deliveryFee)}</span></div>}
          <div className="flex justify-between font-bold text-sm border-t border-dashed border-black mt-1 pt-1">
            <span>TOTAL</span><span>{rupiah(order.total)}</span>
          </div>
        </div>

        {order.payment && (
          <div className="border-t border-dashed border-black my-2 pt-2">
            <div className="flex justify-between">
              <span>Bayar · {paymentLabel[order.payment.method] ?? order.payment.method}</span>
              <span>{order.payment.status === "PAID" ? "LUNAS" : order.payment.status}</span>
            </div>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2 pt-2 text-center">
          <p>Terima kasih 🌸</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 3mm; }
          body { background: #fff; }
        }
      `}</style>
    </div>
  );
}
