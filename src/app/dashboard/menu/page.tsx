import { prisma } from "@/lib/prisma";
import MenuManager from "./MenuManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const outlets = await prisma.outlet.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return <MenuManager outlets={outlets} />;
}
