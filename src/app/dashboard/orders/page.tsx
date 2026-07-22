import { getSession } from "@/lib/auth";
import OrdersManager from "./OrdersManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  return <OrdersManager role={user.role} />;
}
