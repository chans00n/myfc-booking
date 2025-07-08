'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

const clientInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
})

type ClientInfoData = z.infer<typeof clientInfoSchema>

interface ClientInformationProps {
  onValidate: (isValid: boolean) => void
}

export function ClientInformation({ onValidate }: ClientInformationProps) {
  const { user, profile } = useAuth()
  const { bookingData, updateBookingData } = useBooking()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ClientInfoData>({
    resolver: zodResolver(clientInfoSchema),
    mode: 'onChange',
    defaultValues: bookingData.clientInfo || {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
  })

  const formValues = watch()

  useEffect(() => {
    onValidate(isValid)
  }, [isValid, onValidate])

  useEffect(() => {
    if (isValid) {
      updateBookingData({ clientInfo: formValues })
    }
  }, [isValid, formValues.firstName, formValues.lastName, formValues.email, formValues.phone, updateBookingData])

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user && profile) {
      setValue('firstName', profile.first_name || '')
      setValue('lastName', profile.last_name || '')
      setValue('email', profile.email)
      setValue('phone', profile.phone || '')
    }
  }, [user, profile, setValue])

  // Update booking data separately to avoid loops
  useEffect(() => {
    if (user) {
      updateBookingData({ isGuest: false, isNewClient: false })
    }
  }, [user?.id, updateBookingData]) // Only depend on user id to avoid loops

  const handleGuestCheckbox = (checked: boolean) => {
    updateBookingData({ isGuest: checked })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Information</h2>
        <p className="text-muted-foreground">Please provide your contact information</p>
      </div>

      {!user && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Guest Booking:</span> You're booking as a guest. 
            You can create an account after completing your booking to manage appointments easily.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>
            We'll use this information to confirm your appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  disabled={!!user}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  disabled={!!user}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={!!user}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {!user && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="guest"
                  checked={bookingData.isGuest}
                  onCheckedChange={handleGuestCheckbox}
                />
                <Label 
                  htmlFor="guest" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Continue as guest (you can create an account later)
                </Label>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}