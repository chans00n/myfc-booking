'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getActiveServices, searchServices } from '@/lib/services/client'
import { formatPrice, formatDuration } from '@/lib/services/schemas'
import { ServiceFilters } from '@/components/services/service-filters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Clock, DollarSign, Search, Calendar } from 'lucide-react'
import type { Service } from '@/types'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [filters, setFilters] = useState<{
    minPrice?: number
    maxPrice?: number
    minDuration?: number
    maxDuration?: number
  }>({})
  const router = useRouter()

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    setLoading(true)
    const data = await getActiveServices()
    setServices(data)
    setFilteredServices(data)
    setLoading(false)
  }

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    applyFilters(term, filters)
  }

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters)
    applyFilters(searchTerm, newFilters)
  }

  const handleResetFilters = () => {
    setFilters({})
    applyFilters(searchTerm, {})
  }

  const applyFilters = async (search: string, currentFilters: typeof filters) => {
    if (search.trim() === '' && Object.keys(currentFilters).length === 0) {
      setFilteredServices(services)
    } else {
      const results = await searchServices(search, currentFilters)
      setFilteredServices(results)
    }
  }

  const handleBookService = (service: Service) => {
    // Store selected service in session storage for booking page
    sessionStorage.setItem('selectedService', JSON.stringify(service))
    router.push('/booking')
  }

  return (
    <PageContainer maxWidth="6xl">
      <PageHeader 
        title="Our Services"
        description="Choose from our range of professional massage therapy services"
      />

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 sm:h-5 w-4 sm:w-5" />
          <Input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
        
        <ServiceFilters 
          onFilter={handleFilter}
          onReset={handleResetFilters}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="p-4 sm:p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map((service) => (
              <Card 
                key={service.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98] touch-manipulation"
                onClick={() => setSelectedService(service)}
              >
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">{service.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 sm:h-4 w-3 sm:w-4" />
                      <span>{formatDuration(service.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 sm:h-4 w-3 sm:w-4" />
                      <span>{formatPrice(service.price_cents)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <CardDescription className="mb-4 text-sm line-clamp-3">
                    {service.description}
                  </CardDescription>
                  <Button 
                    className="w-full h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBookService(service)
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">
                  {searchTerm
                    ? `No services found matching "${searchTerm}"`
                    : 'No services available at the moment'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Service Details Modal */}
      {selectedService && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedService(null)}
        >
          <Card 
            className="max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl pr-8">{selectedService.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <Badge variant="outline" className="h-7 sm:h-6">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(selectedService.duration_minutes)}
                </Badge>
                <Badge variant="outline" className="h-7 sm:h-6">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatPrice(selectedService.price_cents)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">Description</h3>
                <p className="text-sm sm:text-base text-gray-600">{selectedService.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">What to Expect</h3>
                <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1">
                  <li>Professional and certified massage therapists</li>
                  <li>Clean and comfortable treatment rooms</li>
                  <li>Personalized pressure and technique adjustments</li>
                  <li>High-quality oils and lotions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">Preparation</h3>
                <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1">
                  <li>Arrive 10 minutes early to complete intake forms</li>
                  <li>Wear comfortable clothing</li>
                  <li>Communicate any health concerns or preferences</li>
                  <li>Stay hydrated before and after your session</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button 
                  className="flex-1 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
                  onClick={() => handleBookService(selectedService)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book This Service
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
                  onClick={() => setSelectedService(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}