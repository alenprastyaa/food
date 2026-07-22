import { redirect } from "next/navigation";
import { getBuyerSession } from "@/lib/buyerAuth";
import AccountView from "./AccountView";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const buyer = await getBuyerSession();
  if (!buyer) redirect("/account/login");
  return <AccountView />;
}
