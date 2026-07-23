import { getSession } from "@/lib/auth";
import ReservationsManager from "./ReservationsManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  return <ReservationsManager role={user.role} />;
}
