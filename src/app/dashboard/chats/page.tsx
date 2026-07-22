import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import ChatManager from "./ChatManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  return (
    <Suspense>
      <ChatManager role={user.role} />
    </Suspense>
  );
}
