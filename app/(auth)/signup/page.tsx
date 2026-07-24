'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type StepOneFields = {
  ownerName: string
  businessName: string
  email: string
  password: string
}

type StepTwoFields = {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  taxId: string
}

const DUPLICATE_EMAIL_ERROR =
  'An account already exists with this email. Log in instead'
const GENERIC_PROFILE_ERROR =
  "We couldn't save your business details. Check the highlighted fields and try again."

function labelStyle() {
  return {
    fontSize: '13px',
    fontWeight: 700 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [stepOne, setStepOne] = useState<StepOneFields>({
    ownerName: '',
    businessName: '',
    email: '',
    password: '',
  })
  const [stepTwo, setStepTwo] = useState<StepTwoFields>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    taxId: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleStepOneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStep(2)
  }

  async function handleStepTwoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsDuplicateEmail(false)
    setIsSubmitting(true)

    const { data, error: signupError } = await apiClient.POST('/auth/signup', {
      body: {
        ownerName: stepOne.ownerName,
        businessName: stepOne.businessName,
        email: stepOne.email,
        password: stepOne.password,
        addressLine1: stepTwo.addressLine1,
        addressLine2: stepTwo.addressLine2 || undefined,
        city: stepTwo.city,
        state: stepTwo.state,
        postalCode: stepTwo.postalCode,
        country: stepTwo.country,
        taxId: stepTwo.taxId || undefined,
      },
    })

    setIsSubmitting(false)

    if (signupError) {
      const status = (signupError as { error?: string }).error
      const is409 = status === 'An account already exists with this email. Log in instead'
      if (is409) {
        setIsDuplicateEmail(true)
        setError(DUPLICATE_EMAIL_ERROR)
      } else {
        setError(GENERIC_PROFILE_ERROR)
      }
      return
    }

    if (data?.session) {
      await supabase.auth.setSession({
        access_token: data.session.accessToken,
        refresh_token: data.session.refreshToken,
      })
    }

    router.push('/store-type')
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-3">
      <p className="text-center text-sm" style={{ color: '#64748B' }}>
        {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
      </p>
      <Card className="w-full" style={{ backgroundColor: '#FFFFFF' }}>
        <CardHeader>
          {step === 1 ? (
            <h1
              className="mb-2"
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Create your account
            </h1>
          ) : (
            <h2
              className="mb-2"
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Business &amp; tax profile
            </h2>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {isDuplicateEmail ? (
                  <>
                    {DUPLICATE_EMAIL_ERROR.replace(' Log in instead', '')}{' '}
                    <a href="/login" style={{ color: '#0058BA' }}>
                      Log in instead
                    </a>
                  </>
                ) : (
                  error
                )}
              </AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <form onSubmit={handleStepOneSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ownerName" style={labelStyle()}>
                  Owner name
                </Label>
                <Input
                  id="ownerName"
                  required
                  value={stepOne.ownerName}
                  onChange={(e) =>
                    setStepOne((s) => ({ ...s, ownerName: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="businessName" style={labelStyle()}>
                  Business name
                </Label>
                <Input
                  id="businessName"
                  required
                  value={stepOne.businessName}
                  onChange={(e) =>
                    setStepOne((s) => ({ ...s, businessName: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" style={labelStyle()}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={stepOne.email}
                  onChange={(e) =>
                    setStepOne((s) => ({ ...s, email: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" style={labelStyle()}>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={stepOne.password}
                  onChange={(e) =>
                    setStepOne((s) => ({ ...s, password: e.target.value }))
                  }
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                Create your account
              </Button>
              <p className="text-center text-sm" style={{ color: '#64748B' }}>
                Already have an account?{' '}
                <a href="/login" style={{ color: '#0058BA' }}>
                  Log in
                </a>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStepTwoSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addressLine1" style={labelStyle()}>
                  Address line 1
                </Label>
                <Input
                  id="addressLine1"
                  required
                  value={stepTwo.addressLine1}
                  onChange={(e) =>
                    setStepTwo((s) => ({ ...s, addressLine1: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addressLine2" style={labelStyle()}>
                  Address line 2 (optional)
                </Label>
                <Input
                  id="addressLine2"
                  value={stepTwo.addressLine2}
                  onChange={(e) =>
                    setStepTwo((s) => ({ ...s, addressLine2: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city" style={labelStyle()}>
                  City
                </Label>
                <Input
                  id="city"
                  required
                  value={stepTwo.city}
                  onChange={(e) =>
                    setStepTwo((s) => ({ ...s, city: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="state" style={labelStyle()}>
                  State
                </Label>
                <Input
                  id="state"
                  required
                  value={stepTwo.state}
                  onChange={(e) =>
                    setStepTwo((s) => ({ ...s, state: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="postalCode" style={labelStyle()}>
                  Postal code
                </Label>
                <Input
                  id="postalCode"
                  required
                  value={stepTwo.postalCode}
                  onChange={(e) =>
                    setStepTwo((s) => ({ ...s, postalCode: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="country" style={labelStyle()}>
                  Country
                </Label>
                <Input
                  id="country"
                  required
                  value={stepTwo.country}
                  onChange={(e) =>
                    setStepTwo((s) => ({ ...s, country: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="taxId" style={labelStyle()}>
                  Tax ID (optional)
                </Label>
                <Input
                  id="taxId"
                  value={stepTwo.taxId}
                  onChange={(e) =>
                    setStepTwo((s) => ({ ...s, taxId: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                >
                  Finish setup
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
