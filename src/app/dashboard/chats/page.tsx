import { getSession } from "@/lib/auth";
import ChatManager from "./ChatManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  return <ChatManager role={user.role} />;
}
