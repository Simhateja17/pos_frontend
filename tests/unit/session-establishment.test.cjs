const assert = require('node:assert/strict')
const test = require('node:test')

const { establishSessionWith } = require('../../lib/auth/session-establishment.ts')

const session = { accessToken: 'access-token', refreshToken: 'refresh-token' }

test('preserves the authenticated session when a paired register requires a PIN', async () => {
  let signOutCalls = 0
  let prepared = false
  const result = await establishSessionWith(session, {
    installSession: async () => ({ error: null }),
    prepareContext: async () => {
      prepared = true
    },
    loadContext: async () => {
      throw Object.assign(new Error('register locked'), { kind: 'register_locked' })
    },
    signOut: async () => {
      signOutCalls += 1
    },
    isRegisterLockedError: (error) => error?.kind === 'register_locked',
  })

  assert.deepEqual(result, { ok: true, requiresPin: true })
  assert.equal(prepared, true)
  assert.equal(signOutCalls, 0)
})

test('signs out a partially established session for an ordinary context failure', async () => {
  let signOutCalls = 0
  const result = await establishSessionWith(session, {
    installSession: async () => ({ error: null }),
    prepareContext: async () => {},
    loadContext: async () => {
      throw new Error('network unavailable')
    },
    signOut: async () => {
      signOutCalls += 1
    },
    isRegisterLockedError: () => false,
  })

  assert.deepEqual(result, {
    ok: false,
    message: 'We could not open your store context. Please try again.',
  })
  assert.equal(signOutCalls, 1)
})

test('does not prepare owner back-office state when session installation fails', async () => {
  let prepared = false
  const result = await establishSessionWith(session, {
    installSession: async () => ({ error: new Error('invalid session') }),
    prepareContext: async () => {
      prepared = true
    },
    loadContext: async () => {},
    signOut: async () => {},
    isRegisterLockedError: () => false,
  })

  assert.equal(result.ok, false)
  assert.equal(prepared, false)
})
