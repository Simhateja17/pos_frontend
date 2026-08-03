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
          fontSize: '10.5px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--muted)',
        }}
      >
        {label}
      </div>
      <span
        className={colorClass}
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-.02em',
          lineHeight: 1.2,
        }}
      >
        {amount}
      </span>
    </div>
  )
}
