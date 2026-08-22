export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
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
