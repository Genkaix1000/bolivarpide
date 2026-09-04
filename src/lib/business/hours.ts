/** Horarios de atención — zona Bolívar (ponytail: no cruza medianoche). */

export type BusinessHourRow = {
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
};

const BA_TZ = "America/Argentina/Buenos_Aires";
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function baWeekday(): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: BA_TZ, weekday: "short" }).format(
    new Date(),
  );
  return WEEKDAY_SHORT[short] ?? 0;
}

function baMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export function isOpenByHours(rows: BusinessHourRow[]): boolean {
  const today = rows.find((r) => r.weekday === baWeekday());
  if (!today || today.closed || !today.open_time || !today.close_time) return false;
  const now = baMinutes();
  const open = timeToMinutes(today.open_time);
  const close = timeToMinutes(today.close_time);
  if (close <= open) return now >= open || now < close;
  return now >= open && now < close;
}

export function formatHoursSummary(rows: BusinessHourRow[]): string {
  const open = rows
    .filter((r) => !r.closed && r.open_time && r.close_time)
    .sort((a, b) => a.weekday - b.weekday);
  if (open.length === 0) return "Sin horarios cargados";

  const sameSlot = open.every(
    (r) => r.open_time === open[0].open_time && r.close_time === open[0].close_time,
  );
  const timeStr = `${formatTime(open[0].open_time!)} a ${formatTime(open[0].close_time!)} hs`;

  if (sameSlot && open.length >= 2) {
    const first = DAY_NAMES[open[0].weekday];
    const last = DAY_NAMES[open[open.length - 1].weekday];
    return `${first} a ${last} — ${timeStr}`;
  }

  return open
    .map((r) => `${DAY_NAMES[r.weekday]} ${formatTime(r.open_time!)}–${formatTime(r.close_time!)}`)
    .join(" · ");
}
