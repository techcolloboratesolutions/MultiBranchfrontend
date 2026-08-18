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
