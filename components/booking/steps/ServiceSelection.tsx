'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { getActiveServices } from '@/lib/services/client'
import { formatPrice, formatDuration } from '@/lib/services/schemas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { Service } from '@/types'

interface ServiceSelectionProps {
  onValidate: (isValid: boolean) => void
}

export function ServiceSelection({ onValidate }: ServiceSelectionProps) {
  const { bookingData, updateBookingData } = useBooking()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    bookingData.service?.id || ''
  )

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    onValidate(!!selectedServiceId)
  }, [selectedServiceId, onValidate])

  const loadServices = async () => {
    setLoading(true)
    const data = await getActiveServices()
    setServices(data)
    setLoading(false)
  }

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedServiceId(serviceId)
      updateBookingData({ service })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select a Service</h2>
        <p className="text-muted-foreground">Choose the massage service that best suits your needs</p>
      </div>

      <RadioGroup value={selectedServiceId} onValueChange={handleServiceSelect}>
        <div className="grid gap-4">
          {services.map((service) => (
            <Card 
              key={service.id}
              className={`cursor-pointer transition-colors ${
                selectedServiceId === service.id 
                  ? 'border-primary ring-2 ring-primary ring-offset-2' 
                  : 'hover:border-gray-400'
              }`}
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
      </RadioGroup>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No services available at the moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}