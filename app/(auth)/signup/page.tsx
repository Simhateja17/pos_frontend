'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { IndiaSignupForm } from '@/components/auth/india-signup-form'
import { InternationalSignupForm } from '@/components/auth/international-signup-form'

function SignupRouter() {
  const region = useSearchParams().get('region')
  return region === 'INTL' ? <InternationalSignupForm /> : <IndiaSignupForm />
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupRouter />
    </Suspense>
  )
}
