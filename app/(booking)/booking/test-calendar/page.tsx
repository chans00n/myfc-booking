'use client'

import { useState } from 'react'
import { DatePicker } from '@/components/calendar/DatePicker'
import { TimeSlotPicker } from '@/components/calendar/TimeSlotPicker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { TimeSlot } from '@/types'

export default function TestCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Calendar Integration</h1>
        <p className="text-gray-600">Select a date and time for your appointment</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Select Date</h2>
          <DatePicker 
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Select Time</h2>
          {selectedDate ? (
            <TimeSlotPicker
              date={selectedDate}
              serviceDurationMinutes={60}
              onSelectSlot={setSelectedSlot}
              selectedSlot={selectedSlot}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Please select a date first
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedDate && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p>
              <strong>Time:</strong> {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}