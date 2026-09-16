/** Shown after a plan bought via the mobile activation email is confirmed. */
export default function ActivationCompletePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 16px' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Your store is active</h1>
        <p style={{ color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
          Your plan is confirmed. Go back to the Ambel POS app to start selling.
        </p>
        <a className="btn btn-pri" href="ambelpos://billing-complete" style={{ marginTop: 20, display: 'inline-flex' }}>
          Open Ambel POS
        </a>
        <p style={{ color: 'var(--muted)', marginTop: 14, fontSize: 13, lineHeight: 1.6 }}>
          If the app doesn&apos;t open, switch to it and tap <strong>I&apos;ve paid, check again</strong>.
        </p>
      </div>
    </main>
  )
}
