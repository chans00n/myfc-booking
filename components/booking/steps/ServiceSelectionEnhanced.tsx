'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'
import { useConsultationEligibility } from '@/hooks/useConsultationEligibility'
import { getActiveServices } from '@/lib/services/client'
import { formatPrice, formatDuration } from '@/lib/services/schemas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Star, Info, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'

interface ServiceSelectionEnhancedProps {
  onValidate: (isValid: boolean) => void
  preSelectedServiceId?: string | null
}

export function ServiceSelectionEnhanced({ onValidate, preSelectedServiceId }: ServiceSelectionEnhancedProps) {
  const { bookingData, updateBookingData } = useBooking()
  const { user } = useAuth()
  const consultationEligibility = useConsultationEligibility()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    bookingData.service?.id || preSelectedServiceId || ''
  )

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    // If we have a pre-selected service and services are loaded, select it
    if (preSelectedServiceId && services.length > 0) {
      const service = services.find(s => s.id === preSelectedServiceId)
      if (service && (!bookingData.service || bookingData.service.id !== preSelectedServiceId)) {
        console.log('Pre-selecting service from URL:', service)
        handleServiceSelect(service.id)
      }
    }
  }, [preSelectedServiceId, services])

  useEffect(() => {
    const isValid = !!selectedServiceId && !!bookingData.service
    console.log('Service validation:', { selectedServiceId, hasService: !!bookingData.service, isValid })
    onValidate(isValid)
  }, [selectedServiceId, bookingData.service, onValidate])

  const loadServices = async () => {
    setLoading(true)
    try {
      const data = await getActiveServices()
      console.log('Loaded services:', data)
      setServices(data)
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      console.log('Selecting service:', service)
      setSelectedServiceId(serviceId)
      updateBookingData({ 
        service,
        isConsultation: service.is_consultation || false
      })
    }
  }

  const isFirstTimeVisitor = !user || bookingData.isNewClient

  if (loading || consultationEligibility.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Separate consultation and regular services
  const consultationService = services.find(s => s.is_consultation)
  const regularServices = services.filter(s => !s.is_consultation)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select a Service</h2>
        <p className="text-muted-foreground">
          {isFirstTimeVisitor 
            ? "New client? We recommend starting with a free consultation!"
            : "Choose the massage service that best suits your needs"}
        </p>
      </div>

      <RadioGroup value={selectedServiceId} onValueChange={handleServiceSelect}>
        <div className="space-y-6">
          {/* Consultation Service - Show prominently if eligible */}
          {consultationService && consultationEligibility.isEligible && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h3 className="font-semibold text-lg">Recommended for New Clients</h3>
              </div>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all relative overflow-hidden",
                  "border-2 border-primary/50 bg-primary/5",
                  selectedServiceId === consultationService.id && "ring-2 ring-primary ring-offset-2",
                  "hover:border-primary hover:shadow-lg"
                )}
              >
                <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 text-sm font-semibold">
                  FREE
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={consultationService.id} id={consultationService.id} />
                      <Label htmlFor={consultationService.id} className="cursor-pointer space-y-1">
                        <CardTitle className="text-xl">{consultationService.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            One-time offer
                          </Badge>
                          <span className="text-muted-foreground">{formatDuration(consultationService.duration_minutes)}</span>
                          <span className="font-bold text-green-600 text-lg">FREE</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{consultationService.description}</CardDescription>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">What's included:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Personalized health assessment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Custom treatment plan recommendation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Q&A with our experienced therapist</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Available via phone, video, or in-person</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Show message if consultation was already used */}
          {consultationService && !consultationEligibility.isEligible && user && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You've already used your free consultation. Check out our massage services below!
              </AlertDescription>
            </Alert>
          )}

          {/* Regular Services */}
          {regularServices.length > 0 && (
            <div className="space-y-4">
              {(consultationService && consultationEligibility.isEligible) && (
                <h3 className="font-semibold text-lg text-muted-foreground">Or choose a massage service:</h3>
              )}
              
              <div className="grid gap-4">
                {regularServices.map((service) => (
                  <Card 
                    key={service.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedServiceId === service.id 
                        ? "border-primary ring-2 ring-primary ring-offset-2" 
                        : "hover:border-gray-400"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value={service.id} id={service.id} />
                          <Label htmlFor={service.id} className="cursor-pointer space-y-1">
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatDuration(service.duration_minutes)}</span>
                              <span className="font-medium">{formatPrice(service.price_cents)}</span>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{service.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </RadioGroup>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No services available at the moment</p>
          </CardContent>
        </Card>
      )}

      {/* First-time visitor tip */}
      {isFirstTimeVisitor && consultationService && consultationEligibility.isEligible && (
        <Alert className="border-primary/50 bg-primary/5">
          <Star className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>First time?</strong> We recommend starting with our free consultation to create a 
            personalized treatment plan tailored to your specific needs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}