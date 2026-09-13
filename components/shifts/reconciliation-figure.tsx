'use client'

import { useT } from '@/lib/i18n/i18n'

export function ReconciliationFigure({
  label,
  amount,
  variant,
}: {
  label: string
  amount: string
  variant: 'neutral' | 'match' | 'variance'
}) {
  const t = useT()
  const colorClass = variant === 'match' ? 'b-green' : variant === 'variance' ? 'b-amber' : ''
  return (
    <div aria-label={t('shifts.reconciliationFigureAria', { label, amount })}>
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
