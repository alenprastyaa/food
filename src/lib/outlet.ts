type OutletHours = { isActive: boolean; openTime?: string | null; closeTime?: string | null };

/** Whether an outlet is open right now, from its manual toggle + posted operating hours. */
export function isOutletOpen(outlet: OutletHours, now = new Date()) {
  if (!outlet.isActive) return false;
  if (!outlet.openTime || !outlet.closeTime) return true;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = outlet.openTime.split(":").map(Number);
  const [ch, cm] = outlet.closeTime.split(":").map(Number);
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  if (close <= open) return minutes >= open || minutes < close; // spans midnight
  return minutes >= open && minutes < close;
}
