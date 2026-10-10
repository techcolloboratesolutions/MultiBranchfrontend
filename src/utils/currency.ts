export function formatInr(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) {
    return "₹0.00";
  }
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

export function monthTotalProfit(
  business: string | number | null | undefined,
  purchase: string | number | null | undefined,
  expense: string | number | null | undefined,
): number {
  const value = Number(business ?? 0) - Number(purchase ?? 0) - Number(expense ?? 0);
  return Number.isNaN(value) ? 0 : value;
}
