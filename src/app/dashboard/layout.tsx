import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  let outletName: string | undefined;
  if (user.outletId) {
    const o = await prisma.outlet.findUnique({ where: { id: user.outletId }, select: { name: true } });
    outletName = o?.name;
  }

  return (
    <div className="min-h-screen bg-washi lg:flex">
      <Sidebar user={{ name: user.name, role: user.role, outletName }} />
      <main className="flex-1 min-w-0 bg-grain">{children}</main>
    </div>
  );
}
