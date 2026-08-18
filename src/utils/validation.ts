export function required(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || String(value).trim() === "") {
    return `${label} is required.`;
  }
  return undefined;
}

export function positiveAmount(value: unknown): string | undefined {
  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) {
    return "Enter a valid amount of 0 or more.";
  }
  return undefined;
}
