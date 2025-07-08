'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getAvailableTimeSlots } from '@/lib/availability'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { TimeSlot } from '@/types'

interface TimeSlotPickerProps {
  date: Date
  serviceDurationMinutes: number
  onSelectSlot: (slot: TimeSlot) => void
  selectedSlot?: TimeSlot
}

export function TimeSlotPicker({
  date,
  serviceDurationMinutes,
  onSelectSlot,
  selectedSlot
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSlots()
  }, [date, serviceDurationMinutes])

  const loadSlots = async () => {
    setLoading(true)
    const availableSlots = await getAvailableTimeSlots(date, serviceDurationMinutes)
    setSlots(availableSlots)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const morningSlots = slots.filter(slot => {
    const hour = slot.start.getHours()
    return hour < 12
  })

  const afternoonSlots = slots.filter(slot => {
    const hour = slot.start.getHours()
    return hour >= 12 && hour < 17
  })

  const eveningSlots = slots.filter(slot => {
    const hour = slot.start.getHours()
    return hour >= 17
  })

  const renderSlots = (slotGroup: TimeSlot[], title: string) => {
    if (slotGroup.length === 0) return null

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {slotGroup.map((slot, index) => {
            const isSelected = selectedSlot?.start.getTime() === slot.start.getTime()
            return (
              <Button
                key={index}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className={`min-h-[44px] touch-manipulation ${!slot.available ? 'opacity-50' : ''}`}
                disabled={!slot.available}
                onClick={() => onSelectSlot(slot)}
              >
                {format(slot.start, 'h:mm a')}
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <p className="text-sm">No available time slots for this date</p>
      </div>
    )
  }

  const availableCount = slots.filter(s => s.available).length

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {availableCount} time {availableCount === 1 ? 'slot' : 'slots'} available
      </div>
      
      {renderSlots(morningSlots, 'Morning')}
      {renderSlots(afternoonSlots, 'Afternoon')}
      {renderSlots(eveningSlots, 'Evening')}
    </div>
  )
}