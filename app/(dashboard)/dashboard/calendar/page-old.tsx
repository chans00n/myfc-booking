'use client'

import { useState } from 'react'
import { CalendarView } from '@/components/calendar/CalendarView'
import { BusinessHoursManager } from '@/components/admin/BusinessHoursManager'
import { TimeBlockForm } from '@/components/admin/TimeBlockForm'
import { AppointmentSettingsForm } from '@/components/admin/AppointmentSettingsForm'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Settings } from 'lucide-react'

export default function CalendarPage() {
  const [showTimeBlockForm, setShowTimeBlockForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // Pre-fill the time block form with selected time range
    setShowTimeBlockForm(true)
  }

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Calendar Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your availability and appointments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTimeBlockForm(true)} size="sm" className="flex-1 sm:flex-initial">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Block Time</span>
            <span className="sm:hidden">Block</span>
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(true)} size="sm" className="flex-1 sm:flex-initial">
            <Settings className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Settings</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="text-xs sm:text-sm">Calendar View</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs sm:text-sm">Business Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView 
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <BusinessHoursManager />
        </TabsContent>
      </Tabs>

      {/* Time Block Form Dialog */}
      <Dialog open={showTimeBlockForm} onOpenChange={setShowTimeBlockForm}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Block Time</DialogTitle>
            <DialogDescription className="text-sm">
              Block out time when you're not available for appointments
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <TimeBlockForm 
              onSuccess={() => {
                setShowTimeBlockForm(false)
                // Refresh calendar
              }}
              onCancel={() => setShowTimeBlockForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Appointment Settings</DialogTitle>
            <DialogDescription className="text-sm">
              Configure your appointment booking preferences
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <AppointmentSettingsForm 
              onSuccess={() => setShowSettings(false)}
              onCancel={() => setShowSettings(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}