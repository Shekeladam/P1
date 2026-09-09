export function formatPrice(value: number): string {
  const decimals = value >= 100 ? 2 : value >= 1 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
