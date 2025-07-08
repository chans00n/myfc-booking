'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { formatPrice } from '@/lib/services/schemas'
import { Filter, X } from 'lucide-react'

interface ServiceFiltersProps {
  onFilter: (filters: {
    minPrice?: number
    maxPrice?: number
    minDuration?: number
    maxDuration?: number
  }) => void
  onReset: () => void
}

export function ServiceFilters({ onFilter, onReset }: ServiceFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 200])
  const [durationRange, setDurationRange] = useState([15, 180])

  const handleApplyFilters = () => {
    onFilter({
      minPrice: priceRange[0] * 100, // Convert to cents
      maxPrice: priceRange[1] * 100,
      minDuration: durationRange[0],
      maxDuration: durationRange[1],
    })
  }

  const handleReset = () => {
    setPriceRange([0, 200])
    setDurationRange([15, 180])
    onReset()
  }

  return (
    <div className="mb-4 sm:mb-6">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="mb-3 sm:mb-4 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
      >
        <Filter className="mr-2 h-4 w-4" />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>

      {showFilters && (
        <Card className="animate-in slide-in-from-top duration-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Filter Services</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
            <div>
              <Label className="mb-3 block text-sm sm:text-base">
                Price Range: {formatPrice(priceRange[0] * 100)} - {formatPrice(priceRange[1] * 100)}
              </Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={200}
                step={10}
                className="w-full touch-manipulation"
              />
            </div>

            <div>
              <Label className="mb-3 block text-sm sm:text-base">
                Duration: {durationRange[0]} - {durationRange[1]} minutes
              </Label>
              <Slider
                value={durationRange}
                onValueChange={setDurationRange}
                min={15}
                max={180}
                step={15}
                className="w-full touch-manipulation"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={handleApplyFilters}
                className="h-12 sm:h-10 text-base sm:text-sm touch-manipulation flex-1 sm:flex-initial"
              >
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
              >
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}