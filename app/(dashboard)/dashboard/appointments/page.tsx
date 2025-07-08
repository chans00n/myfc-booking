'use client'

import { useState, useEffect } from 'react'
import { AdminSiteHeader } from '@/components/admin-site-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AppointmentsList } from '@/components/appointments/AppointmentsList'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Search, X, Eye, CheckCircle, XCircle, FileText, Save, DollarSign, CreditCard, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Appointment, AppointmentStatus, PaymentPreference } from '@/types'
import { Textarea } from '@/components/ui/textarea'

interface AppointmentWithRelations extends Appointment {
  client: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  }
  service: {
    id: string
    name: string
    duration_minutes: number
    price_cents: number
    is_consultation?: boolean
  }
  consultation?: Array<{
    id: string
    consultation_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    daily_room_url: string | null
  }>
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  no_show: 'destructive',
}

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'check'>('cash')
  const [paymentReference, setPaymentReference] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          service:services!appointments_service_id_fkey(
            id,
            name,
            duration_minutes,
            price_cents,
            is_consultation
          ),
          consultation:consultations(*)
        `)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setAppointments(data as AppointmentWithRelations[])
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Appointment status updated')
      await fetchAppointments()
      setShowDetails(false)
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Failed to update appointment status')
    } finally {
      setUpdating(false)
    }
  }

  const updateAppointmentNotes = async () => {
    if (!selectedAppointment) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ notes: notesValue })
        .eq('id', selectedAppointment.id)

      if (error) throw error

      toast.success('Notes updated successfully')
      await fetchAppointments()
      setEditingNotes(false)
      
      // Update the selected appointment with new notes
      setSelectedAppointment({ ...selectedAppointment, notes: notesValue })
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Failed to update notes')
    } finally {
      setUpdating(false)
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = searchTerm === '' || 
      appointment.client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hour), parseInt(minute))
    return format(date, 'h:mm a')
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Appointments</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage all client appointments
                </p>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by client name, email, or service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | 'all')}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mb-4" />
                      <p>No appointments found</p>
                    </div>
                  ) : (
                    <AppointmentsList
                      appointments={filteredAppointments}
                      onViewDetails={(appointment) => {
                        setSelectedAppointment(appointment)
                        setNotesValue(appointment.notes || '')
                        setEditingNotes(false)
                        setShowDetails(true)
                      }}
                      statusColors={statusColors}
                      statusLabels={statusLabels}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and manage appointment information
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-sm">
                    {format(new Date(selectedAppointment.appointment_date), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p className="text-sm">
                    {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <p className="text-sm">
                    {selectedAppointment.client.first_name} {selectedAppointment.client.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">{selectedAppointment.client.email}</p>
                  {selectedAppointment.client.phone && (
                    <p className="text-sm text-muted-foreground">{selectedAppointment.client.phone}</p>
                  )}
                </div>
                <div>
                  <Label>Service</Label>
                  <p className="text-sm">{selectedAppointment.service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.service.duration_minutes} minutes
                  </p>
                  <p className="text-sm">{formatPrice(selectedAppointment.service.price_cents)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge variant={statusColors[selectedAppointment.status]} className="mt-1">
                    {statusLabels[selectedAppointment.status]}
                  </Badge>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Badge 
                    variant={selectedAppointment.payment_status === 'paid' ? 'outline' : 'secondary'} 
                    className="mt-1"
                  >
                    {selectedAppointment.payment_status}
                  </Badge>
                  {selectedAppointment.payment_preference && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAppointment.payment_preference === 'pay_now' && 'Paid online'}
                      {selectedAppointment.payment_preference === 'pay_at_appointment' && 'Pay at appointment'}
                      {selectedAppointment.payment_preference === 'pay_cash' && 'Cash payment'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Notes</Label>
                  {!editingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNotes(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {selectedAppointment.notes ? 'Edit' : 'Add'} Notes
                    </Button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add appointment notes..."
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={updateAppointmentNotes}
                        disabled={updating}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Notes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNotes(false)
                          setNotesValue(selectedAppointment.notes || '')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.notes || 'No notes added yet'}
                  </p>
                )}
              </div>

              {/* Show consultation room link if available */}
              {selectedAppointment.service?.is_consultation && 
               selectedAppointment.consultation && 
               selectedAppointment.consultation.length > 0 &&
               selectedAppointment.consultation[0].daily_room_url &&
               (selectedAppointment.consultation[0].consultation_status === 'scheduled' || 
                selectedAppointment.consultation[0].consultation_status === 'in_progress') && (
                <div>
                  <Label>Consultation Room</Label>
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => window.open(selectedAppointment.consultation![0].daily_room_url!, '_blank')}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Consultation Room
                  </Button>
                </div>
              )}

              <div>
                <Label>Actions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAppointment.status === 'scheduled' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'confirmed')}
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancelled')}
                        disabled={updating}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                        disabled={updating}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'no_show')}
                        disabled={updating}
                      >
                        Mark No Show
                      </Button>
                    </>
                  )}
                  {/* Add Collect Payment button for unpaid appointments */}
                  {selectedAppointment.payment_status === 'will_pay_later' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setPaymentAmount((selectedAppointment.total_price_cents / 100).toFixed(2))
                        setShowPaymentDialog(true)
                      }}
                      disabled={updating}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Collect Payment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Collection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>
              Record payment collection for this appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label>Service</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.service.name} - {formatPrice(selectedAppointment.total_price_cents)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'check') => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'check' && (
                <div>
                  <Label htmlFor="reference">Check Number</Label>
                  <Input
                    id="reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter check number"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedAppointment || !paymentAmount) return
                
                setUpdating(true)
                try {
                  // Update appointment payment status
                  const { error: appointmentError } = await supabase
                    .from('appointments')
                    .update({ 
                      payment_status: 'paid',
                      payment_collected_at: new Date().toISOString(),
                      payment_collection_method: paymentMethod === 'card' ? 'in_person_card' : paymentMethod
                    })
                    .eq('id', selectedAppointment.id)

                  if (appointmentError) throw appointmentError

                  // Record payment collection
                  const { error: collectionError } = await supabase
                    .from('payment_collections')
                    .insert({
                      appointment_id: selectedAppointment.id,
                      collected_by: (await supabase.auth.getUser()).data.user?.id,
                      amount_cents: Math.round(parseFloat(paymentAmount) * 100),
                      collection_method: paymentMethod === 'card' ? 'in_person_card' : paymentMethod,
                      payment_reference: paymentMethod === 'check' ? paymentReference : null
                    })

                  if (collectionError) throw collectionError

                  toast.success('Payment collected successfully')
                  await fetchAppointments()
                  setShowPaymentDialog(false)
                  setShowDetails(false)
                } catch (error) {
                  console.error('Error collecting payment:', error)
                  toast.error('Failed to collect payment')
                } finally {
                  setUpdating(false)
                }
              }}
              disabled={updating || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Collect Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}