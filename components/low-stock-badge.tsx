export function LowStockBadge({
  quantity,
  threshold,
}: {
  quantity: number
  threshold: number
}) {
  if (quantity > threshold) {
    return null
  }

  return <span className="b-amber">Low stock</span>
}
