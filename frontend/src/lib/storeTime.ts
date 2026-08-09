export const STORE_TIME_ZONE = "America/Recife";

export type DashboardGranularity = "hour" | "day";
export type DashboardPreset = "today" | "yesterday" | "last7" | "last30" | "month";
export type StoreDateRange = { start: string; end: string };

const EXPLICIT_OFFSET = /(Z|[+-]\d{2}:\d{2})$/i;
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/;
const LEGACY_DISPLAY_DATE_TIME = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;

function storeLocalDateTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, second: number) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const storeParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcGuess));
  const part = Object.fromEntries(storeParts.map((item) => [item.type, Number(item.value)]));
  const renderedAsUtc = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second);
  return new Date(utcGuess - (renderedAsUtc - utcGuess)).toISOString();
}

export function normalizeApiDateTime(value: string) {
  const timestamp = value.trim();
  if (EXPLICIT_OFFSET.test(timestamp)) return timestamp;
  if (LOCAL_DATE_TIME.test(timestamp)) {
    const [date, time] = timestamp.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute, second = 0] = time.split(":").map(Number);
    return storeLocalDateTimeToUtc(year, month, day, hour, minute, second);
  }
  const legacy = timestamp.match(LEGACY_DISPLAY_DATE_TIME);
  if (legacy) return storeLocalDateTimeToUtc(
    Number(legacy[3]), Number(legacy[2]), Number(legacy[1]), Number(legacy[4]), Number(legacy[5]), 0,
  );
  return timestamp;
}

export function parseApiDateTime(value: string | Date) {
  if (value instanceof Date) return new Date(value.getTime());
  return new Date(normalizeApiDateTime(value));
}

export function apiDateTimeMillis(value: string) {
  const timestamp = parseApiDateTime(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function formatStoreDateTime(value: string | Date) {
  const timestamp = parseApiDateTime(value);
  if (Number.isNaN(timestamp.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: STORE_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(timestamp);
}

export function formatStoreDate(value: string | Date) {
  const timestamp = parseApiDateTime(value);
  if (Number.isNaN(timestamp.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: STORE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(timestamp);
}

export function formatStoreTime(value: string | Date) {
  const timestamp = parseApiDateTime(value);
  if (Number.isNaN(timestamp.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: STORE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(timestamp);
}

export function dashboardPointLabel(value: string, granularity: DashboardGranularity) {
  const timestamp = parseApiDateTime(value);
  if (Number.isNaN(timestamp.getTime())) return "";
  if (granularity === "hour") {
    const hour = new Intl.DateTimeFormat("pt-BR", {
      timeZone: STORE_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(timestamp);
    return `${hour}h`;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: STORE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(timestamp);
}

export function storeDateString(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function shiftCalendarDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

export function dashboardRange(preset: DashboardPreset, now: Date = new Date()): StoreDateRange {
  const today = storeDateString(now);
  if (preset === "yesterday") {
    const yesterday = shiftCalendarDate(today, -1);
    return { start: yesterday, end: yesterday };
  }
  if (preset === "last7") return { start: shiftCalendarDate(today, -6), end: today };
  if (preset === "last30") return { start: shiftCalendarDate(today, -29), end: today };
  if (preset === "month") return { start: `${today.slice(0, 8)}01`, end: today };
  return { start: today, end: today };
}
