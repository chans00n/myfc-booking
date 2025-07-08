'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Video, MapPin, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConsultationTypeSelectionProps {
  onValidate: (isValid: boolean) => void
}

const consultationTypes = [
  {
    id: 'phone',
    name: 'Phone Consultation',
    description: 'A 30-minute phone call to discuss your needs',
    icon: Phone,
    features: [
      'Convenient from anywhere',
      'No travel required',
      'Perfect for initial discussion',
      'Flexible scheduling'
    ]
  },
  {
    id: 'video',
    name: 'Video Consultation',
    description: 'Face-to-face consultation via video call',
    icon: Video,
    features: [
      'Visual assessment possible',
      'More personal connection',
      'Screen sharing for exercises',
      'Recorded for your reference'
    ],
    recommended: true
  },
  {
    id: 'in_person',
    name: 'In-Person Consultation',
    description: 'Meet at our clinic for a hands-on assessment',
    icon: MapPin,
    features: [
      'Physical assessment',
      'Tour of facilities',
      'Meet your therapist',
      'Most comprehensive option'
    ]
  }
]

export function ConsultationTypeSelection({ onValidate }: ConsultationTypeSelectionProps) {
  const { bookingData, updateBookingData } = useBooking()
  const [selectedType, setSelectedType] = useState<string>(bookingData.consultationType || '')

  useEffect(() => {
    // Validate on mount and when selection changes
    onValidate(!!selectedType)
  }, [selectedType, onValidate])

  const handleSelection = (typeId: string) => {
    setSelectedType(typeId)
    updateBookingData({ 
      consultationType: typeId as 'phone' | 'video' | 'in_person'
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Consultation Type</h2>
        <p className="text-muted-foreground">
          Select how you'd like to connect with our massage therapist
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {consultationTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id
          
          return (
            <Card
              key={type.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                isSelected && "ring-2 ring-primary",
                type.recommended && "border-primary"
              )}
              onClick={() => handleSelection(type.id)}
            >
              {type.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={cn(
                  "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{type.name}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {isSelected && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-primary text-center">
                      Selected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mt-6">
        <p className="text-sm text-center text-muted-foreground">
          <strong>Note:</strong> All consultation types are completely free and last 30 minutes. 
          You can change your preference later if needed.
        </p>
      </div>

      {!selectedType && (
        <div className="text-center text-sm text-destructive">
          Please select a consultation type to continue
        </div>
      )}
    </div>
  )
}