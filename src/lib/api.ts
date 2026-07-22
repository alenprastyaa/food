import { NextResponse } from "next/server";
import { getSession, SessionUser } from "./auth";

export const ok = (data: unknown = {}, init?: number) => NextResponse.json(data, { status: init ?? 200 });
export const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function authed(): Promise<SessionUser | null> {
  return await getSession();
}

/** invoice number generator */
export function invoiceNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1).toString().padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `NK-${ymd}-${rnd}`;
}
