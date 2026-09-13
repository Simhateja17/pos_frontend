'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
import { useT } from '@/lib/i18n/i18n'
import styles from './entitlement-usage-panel.module.css'

type BillingStatus = components['schemas']['BillingStatus']
type Region = components['schemas']['BillingRegion']
type EntitlementValue = number | 'unlimited'

type EntitlementStatus = BillingStatus & {
  planKey?: string
  region?: Region
  entitlementSource?: 'subscription' | 'trial' | 'free' | 'blocked'
  entitlementVersion?: string
  entitlements?: {
    maxLocations: EntitlementValue
    maxActiveUsers: EntitlementValue
    maxActiveRegisters: EntitlementValue
    monthlyPosTransactions: EntitlementValue
  }
  usage?: {
    businessMonth: string
    locations: number
    activeUsers: number
    activeRegisters: number
    monthlyPosTransactions: number
  }
}

function limitText(value: EntitlementValue | undefined, unavailable: string, unlimited: string): string {
  return value === 'unlimited' ? unlimited : typeof value === 'number' ? String(value) : unavailable
}

export function EntitlementUsagePanel({
  region,
  status: providedStatus,
}: {
  region: Region
  status?: EntitlementStatus | null
}) {
  const t = useT()
  const [status, setStatus] = useState<EntitlementStatus | null>(providedStatus ?? null)
  const [loading, setLoading] = useState(providedStatus === undefined)

  useEffect(() => {
    if (providedStatus !== undefined) {
      setStatus(providedStatus)
      setLoading(false)
      return
    }
    let active = true
    void (async () => {
      try {
        const headers = await authHeaders()
        if (!headers) return
        const { data } = await apiClient.GET('/billing/status', { headers })
        if (active && data) setStatus(data as unknown as EntitlementStatus)
      } catch {
        // Billing status is advisory here; checkout remains usable if the
        // account is not authenticated or the status endpoint is unavailable.
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [region, providedStatus])

  if (loading) return <section className={styles.panel} aria-label={t('billing.usage.planUsage')}><p>{t('billing.loadingDetails')}</p></section>
  if (!status?.usage || !status.entitlements) return null

  const metrics = [
    [t('billing.locations'), status.usage.locations, status.entitlements.maxLocations],
    [t('billing.users'), status.usage.activeUsers, status.entitlements.maxActiveUsers],
    [t('billing.registers'), status.usage.activeRegisters, status.entitlements.maxActiveRegisters],
    [t('billing.usage.posTransactions'), status.usage.monthlyPosTransactions, status.entitlements.monthlyPosTransactions],
  ] as const

  return (
    <section className={styles.panel} aria-label={t('billing.usage.planUsage')}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>{t('billing.usage.currentEntitlement')}</p>
          <h2>{status.planKey ? t('billing.usage.planUsageNamed', { plan: status.planKey }) : t('billing.usage.planUsage')}</h2>
        </div>
        <span className={status.accessAllowed ? styles.active : styles.blocked}>
          {status.accessAllowed ? t('billing.accessActive') : t('billing.paymentRequired')}
        </span>
      </div>
      <p className={styles.note}>
        {t('billing.usage.resourcesOnly')} · {t('billing.usage.transactionsFor', { month: status.usage.businessMonth.slice(0, 7) })} · {region === 'IN' ? t('billing.usage.indiaCatalog') : t('billing.usage.internationalCatalog')}
      </p>
      <div className={styles.grid}>
        {metrics.map(([label, used, limit]) => (
          <div className={styles.metric} key={label}>
            <span>{label}</span>
            <strong>{used} <small>/ {limitText(limit, t('billing.usage.unavailable'), t('billing.usage.unlimited'))}</small></strong>
          </div>
        ))}
      </div>
    </section>
  )
}
