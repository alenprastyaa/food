import { getSession } from "@/lib/auth";
import QueueBoard from "./QueueBoard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  return <QueueBoard role={user.role} />;
}
