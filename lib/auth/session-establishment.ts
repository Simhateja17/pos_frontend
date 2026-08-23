export type BackendSession = {
  accessToken: string
  refreshToken: string
}

export type SessionEstablishmentResult =
  | { ok: true; requiresPin: boolean }
  | { ok: false; message: string }

type SessionEstablishmentDependencies = {
  installSession: (session: BackendSession) => Promise<{ error: unknown }>
  prepareContext: () => Promise<unknown>
  loadContext: () => Promise<unknown>
  signOut: () => Promise<unknown>
  isRegisterLockedError: (error: unknown) => boolean
}

export async function establishSessionWith(
  session: BackendSession,
  dependencies: SessionEstablishmentDependencies,
): Promise<SessionEstablishmentResult> {
  const { error } = await dependencies.installSession(session)

  if (error) {
    return { ok: false, message: 'We could not start your secure session. Please try again.' }
  }

  try {
    await dependencies.prepareContext()
    await dependencies.loadContext()
    return { ok: true, requiresPin: false }
  } catch (error) {
    if (dependencies.isRegisterLockedError(error)) {
      return { ok: true, requiresPin: true }
    }

    await dependencies.signOut()
    return { ok: false, message: 'We could not open your store context. Please try again.' }
  }
}
