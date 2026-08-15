const assert = require('node:assert/strict')
const test = require('node:test')

const { establishSessionWith } = require('../../lib/auth/session-establishment.ts')

const session = { accessToken: 'access-token', refreshToken: 'refresh-token' }

test('preserves the authenticated session when a paired register requires a PIN', async () => {
  let signOutCalls = 0
  const result = await establishSessionWith(session, {
    installSession: async () => ({ error: null }),
    loadContext: async () => {
      throw Object.assign(new Error('register locked'), { kind: 'register_locked' })
    },
    signOut: async () => {
      signOutCalls += 1
    },
    isRegisterLockedError: (error) => error?.kind === 'register_locked',
  })

  assert.deepEqual(result, { ok: true, requiresPin: true })
  assert.equal(signOutCalls, 0)
})

test('signs out a partially established session for an ordinary context failure', async () => {
  let signOutCalls = 0
  const result = await establishSessionWith(session, {
    installSession: async () => ({ error: null }),
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
