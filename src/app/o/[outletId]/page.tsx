import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui";
import StartChat from "./StartChat";

export const dynamic = "force-dynamic";

export default async function OutletPage({ params }: { params: Promise<{ outletId: string }> }) {
  const { outletId } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    include: { menus: { where: { isAvailable: true }, orderBy: { price: "asc" } } },
  });
  if (!outlet) notFound();

  const categories = Array.from(new Set(outlet.menus.map((m) => m.category)));

  return (
    <div className="min-h-screen bg-asanoha">
      <div className="noren h-2 w-full" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Logo size={38} />
          <span className="text-xs font-round font-bold text-emerald-700 bg-emerald-100 rounded-full px-3 py-1 ring-1 ring-emerald-200">
            ● Buka
          </span>
        </div>
        <StartChat outlet={{ id: outlet.id, name: outlet.name, address: outlet.address, phone: outlet.phone }} menus={outlet.menus} categories={categories} />
      </div>
    </div>
  );
}
