'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { DatePicker } from '@/components/calendar/DatePicker'
import { TimeSlotPicker } from '@/components/calendar/TimeSlotPicker'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import type { TimeSlot } from '@/types'

interface DateTimeSelectionProps {
  onValidate: (isValid: boolean) => void
}

export function DateTimeSelection({ onValidate }: DateTimeSelectionProps) {
  const { bookingData, updateBookingData } = useBooking()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(bookingData.date)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>(bookingData.timeSlot)

  useEffect(() => {
    onValidate(!!selectedDate && !!selectedSlot)
  }, [selectedDate, selectedSlot, onValidate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(undefined) // Reset time slot when date changes
    updateBookingData({ 
      date, 
      timeSlot: undefined,
      selectedDate: date.toISOString()
    })
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    updateBookingData({ timeSlot: slot })
  }

  if (!bookingData.service) {
    console.log('DateTimeSelection - No service found in bookingData:', bookingData)
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Please select a service first
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Choose an available date and time for your appointment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="w-full min-w-0">
          <div className="w-full">
            <DatePicker 
              onSelectDate={handleDateSelect}
              selectedDate={selectedDate}
            />
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Select Time</h3>
          {selectedDate ? (
            <Card className="w-full">
              <CardContent className="p-3 sm:p-4">
                <TimeSlotPicker
                  date={selectedDate}
                  serviceDurationMinutes={bookingData.service.duration_minutes}
                  onSelectSlot={handleSlotSelect}
                  selectedSlot={selectedSlot}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-sm sm:text-base">Please select a date first</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedDate && selectedSlot && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium">Selected Appointment:</p>
            <p className="text-lg">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {format(selectedSlot.start, 'h:mm a')}
            </p>
            <p className="text-sm text-muted-foreground">
              Duration: {bookingData.service.duration_minutes} minutes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}