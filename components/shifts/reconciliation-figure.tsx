'use client'

export function ReconciliationFigure({
  label,
  amount,
  variant,
}: {
  label: string
  amount: string
  variant: 'neutral' | 'match' | 'variance'
}) {
  const colorClass = variant === 'match' ? 'b-green' : variant === 'variance' ? 'b-amber' : ''
  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <span
        className={colorClass}
        style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '28px',
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {amount}
      </span>
    </div>
  )
}
