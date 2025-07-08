'use client'

import { useState, useEffect } from 'react'
import { getActiveServices } from '@/lib/services/client'
import { formatPrice, formatDuration } from '@/lib/services/schemas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, DollarSign } from 'lucide-react'
import type { Service } from '@/types'

export default function TestServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadServices = async () => {
      try {
        console.log('Loading services...')
        const data = await getActiveServices()
        console.log('Services loaded:', data)
        setServices(data)
      } catch (err) {
        console.error('Error loading services:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Test Services Page (No Auth)</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <p className="text-gray-600">Found {services.length} services</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(service.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatPrice(service.price_cents)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {services.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No services available</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}