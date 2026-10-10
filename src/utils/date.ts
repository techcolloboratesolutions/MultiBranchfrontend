export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addIsoDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function monthDayWindow(year: number, month: number, page: number): { start: string; end: string; hasNext: boolean } {
  const bounds = monthBounds(year, month);
  const lastDay = Number(bounds.end.slice(-2));
  const startDay = Math.min(page * 15 + 1, lastDay);
  const endDay = Math.min(startDay + 14, lastDay);
  const monthPart = String(month).padStart(2, "0");
  return {
    start: `${year}-${monthPart}-${String(startDay).padStart(2, "0")}`,
    end: `${year}-${monthPart}-${String(endDay).padStart(2, "0")}`,
    hasNext: endDay < lastDay,
  };
}

export function monthBounds(year: number, month: number): { start: string; end: string } {
  const lastDay = new Date(year, month, 0).getDate();
  const monthPart = String(month).padStart(2, "0");
  return {
    start: `${year}-${monthPart}-01`,
    end: `${year}-${monthPart}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function formatDisplayDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function currentMonth(): number {
  return new Date().getMonth() + 1;
}

export function monthDateIsos(year: number, month: number): string[] {
  const lastDay = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const monthPart = String(month).padStart(2, "0");
    return `${year}-${monthPart}-${day}`;
  });
}
