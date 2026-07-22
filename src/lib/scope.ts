import { SessionUser } from "./auth";

export const DELIVERY_FEE = 8000;

/** Prisma where-filter scoping records to the user's outlet (cashier) or all (owner). */
export function outletScope(user: SessionUser, extra: Record<string, unknown> = {}) {
  if (user.role === "OWNER") return extra;
  return { ...extra, outletId: user.outletId ?? "__none__" };
}

/** Can this user act on a record belonging to outletId? */
export function canAccessOutlet(user: SessionUser, outletId: string) {
  return user.role === "OWNER" || user.outletId === outletId;
}
