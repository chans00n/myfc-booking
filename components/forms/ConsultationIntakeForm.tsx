'use client'

import { useState } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Phone, Video, MapPin } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ConsultationIntakeFormProps {
  onSubmit: (data: any) => void
  initialData?: any
}

export function ConsultationIntakeForm({ onSubmit, initialData }: ConsultationIntakeFormProps) {
  const { bookingData, updateBookingData } = useBooking()
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    // Basic info (auto-filled if logged in)
    firstName: initialData?.firstName || bookingData.clientInfo?.firstName || '',
    lastName: initialData?.lastName || bookingData.clientInfo?.lastName || '',
    email: initialData?.email || bookingData.clientInfo?.email || '',
    phone: initialData?.phone || bookingData.clientInfo?.phone || '',
    
    // Consultation specific
    primaryConcerns: initialData?.primaryConcerns || '',
    massageGoals: initialData?.massageGoals || '',
    previousMassageExperience: initialData?.previousMassageExperience || 'never',
    preferredPressure: initialData?.preferredPressure || 'medium',
    bestTimeToCall: initialData?.bestTimeToCall || '',
    preferredContactMethod: bookingData.consultationType || 'video',
    
    // Emergency contact (simplified)
    emergencyContactName: initialData?.emergencyContactName || '',
    emergencyContactPhone: initialData?.emergencyContactPhone || '',
    
    // Additional preferences
    communicationPreferences: initialData?.communicationPreferences || ''
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.primaryConcerns.trim()) newErrors.primaryConcerns = 'Please describe your primary concerns'
    if (!formData.massageGoals.trim()) newErrors.massageGoals = 'Please describe your goals'
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required'
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required'
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    // Update booking context with consultation intake data
    updateBookingData({
      clientInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      },
      consultationIntake: {
        primaryConcerns: formData.primaryConcerns,
        massageGoals: formData.massageGoals,
        previousMassageExperience: formData.previousMassageExperience,
        preferredPressure: formData.preferredPressure,
        bestTimeToCall: formData.bestTimeToCall,
        preferredContactMethod: formData.preferredContactMethod as 'phone' | 'video' | 'in_person',
        communicationPreferences: formData.communicationPreferences
      },
      intakeForm: {
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone
      }
    })
    
    onSubmit(formData)
  }

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'in_person': return <MapPin className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This free consultation helps us understand your needs and create a personalized massage therapy plan.
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How can we reach you?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {bookingData.consultationType === 'phone' && (
            <div>
              <Label htmlFor="bestTimeToCall">Best Time to Call</Label>
              <Input
                id="bestTimeToCall"
                placeholder="e.g., Weekdays after 5pm, Mornings before 10am"
                value={formData.bestTimeToCall}
                onChange={(e) => handleChange('bestTimeToCall', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Concerns */}
      <Card>
        <CardHeader>
          <CardTitle>Your Health & Wellness Goals</CardTitle>
          <CardDescription>Tell us about your needs and expectations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryConcerns">Primary Health Concerns or Pain Areas *</Label>
            <Textarea
              id="primaryConcerns"
              rows={3}
              placeholder="Describe any specific pain, tension, or health concerns you're experiencing..."
              value={formData.primaryConcerns}
              onChange={(e) => handleChange('primaryConcerns', e.target.value)}
              className={errors.primaryConcerns ? 'border-red-500' : ''}
            />
            {errors.primaryConcerns && (
              <p className="text-sm text-red-500 mt-1">{errors.primaryConcerns}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="massageGoals">What Are Your Goals for Massage Therapy? *</Label>
            <Textarea
              id="massageGoals"
              rows={3}
              placeholder="e.g., Pain relief, stress reduction, improved flexibility, relaxation..."
              value={formData.massageGoals}
              onChange={(e) => handleChange('massageGoals', e.target.value)}
              className={errors.massageGoals ? 'border-red-500' : ''}
            />
            {errors.massageGoals && (
              <p className="text-sm text-red-500 mt-1">{errors.massageGoals}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Massage Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Massage Experience</CardTitle>
          <CardDescription>Help us understand your massage therapy background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Previous Massage Experience</Label>
            <RadioGroup
              value={formData.previousMassageExperience}
              onValueChange={(value) => handleChange('previousMassageExperience', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never">Never had a professional massage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="occasional" id="occasional" />
                <Label htmlFor="occasional">Occasional (a few times)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="regular" />
                <Label htmlFor="regular">Regular (monthly or more)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label>Preferred Pressure Level</Label>
            <RadioGroup
              value={formData.preferredPressure}
              onValueChange={(value) => handleChange('preferredPressure', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Light (gentle, relaxing)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Medium (moderate pressure)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="firm" id="firm" />
                <Label htmlFor="firm">Firm (deeper work)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="varies" id="varies" />
                <Label htmlFor="varies">Varies by area</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Required for all clients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactName">Contact Name *</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                className={errors.emergencyContactName ? 'border-red-500' : ''}
              />
              {errors.emergencyContactName && (
                <p className="text-sm text-red-500 mt-1">{errors.emergencyContactName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                className={errors.emergencyContactPhone ? 'border-red-500' : ''}
              />
              {errors.emergencyContactPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.emergencyContactPhone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
          <CardDescription>Any additional preferences or information?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="communicationPreferences"
            rows={2}
            placeholder="e.g., Prefer text over calls, specific availability windows..."
            value={formData.communicationPreferences}
            onChange={(e) => handleChange('communicationPreferences', e.target.value)}
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg">
        Continue to Confirmation
      </Button>
    </form>
  )
}