import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SettingsManager from "./SettingsManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  if (user.role !== "OWNER") redirect("/dashboard");
  return <SettingsManager />;
}
