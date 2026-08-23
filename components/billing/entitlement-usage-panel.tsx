'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
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

function limitText(value: EntitlementValue | undefined): string {
  return value === 'unlimited' ? 'Unlimited' : typeof value === 'number' ? String(value) : 'Unavailable'
}

export function EntitlementUsagePanel({
  region,
  status: providedStatus,
}: {
  region: Region
  status?: EntitlementStatus | null
}) {
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

  if (loading) return <section className={styles.panel} aria-label="Plan usage"><p>Loading current usage…</p></section>
  if (!status?.usage || !status.entitlements) return null

  const metrics = [
    ['Locations', status.usage.locations, status.entitlements.maxLocations],
    ['Active users', status.usage.activeUsers, status.entitlements.maxActiveUsers],
    ['Active registers', status.usage.activeRegisters, status.entitlements.maxActiveRegisters],
    ['POS transactions', status.usage.monthlyPosTransactions, status.entitlements.monthlyPosTransactions],
  ] as const

  return (
    <section className={styles.panel} aria-label="Plan usage">
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Current entitlement</p>
          <h2>{status.planKey ? `${status.planKey} plan usage` : 'Plan usage'}</h2>
        </div>
        <span className={status.accessAllowed ? styles.active : styles.blocked}>
          {status.accessAllowed ? 'Access active' : 'Payment or trial required'}
        </span>
      </div>
      <p className={styles.note}>
        Implemented resources only · POS transactions for {status.usage.businessMonth.slice(0, 7)} · {region === 'IN' ? 'India catalogue' : 'International catalogue'}
      </p>
      <div className={styles.grid}>
        {metrics.map(([label, used, limit]) => (
          <div className={styles.metric} key={label}>
            <span>{label}</span>
            <strong>{used} <small>/ {limitText(limit)}</small></strong>
          </div>
        ))}
      </div>
    </section>
  )
}
