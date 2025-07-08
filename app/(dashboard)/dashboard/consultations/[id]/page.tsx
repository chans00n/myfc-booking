'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminSiteHeader } from '@/components/admin-site-header'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ArrowLeft, Video, Phone, Users, Calendar, Clock, Mail, MessageSquare, FileText, ExternalLink, Play, CheckCircle, XCircle, Download, Send } from 'lucide-react'
import Link from 'next/link'

interface ConsultationDetail {
  id: string
  appointment_id: string
  client_id: string
  consultation_type: 'phone' | 'video' | 'in_person'
  consultation_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  consultation_notes: string | null
  client_goals: string | null
  health_overview: string | null
  started_at: string | null
  completed_at: string | null
  daily_room_name: string | null
  daily_room_url: string | null
  created_at: string
  updated_at: string
  appointment: {
    id: string
    appointment_date: string
    start_time: string
    end_time: string
    status: string
    service: {
      id: string
      name: string
      duration_minutes: number
      price_cents: number
    }
  }
  client: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    date_of_birth: string | null
    created_at: string
  }
}

interface IntakeFormResponse {
  id: string
  form_data: any
  created_at: string
  intake_form: {
    name: string
    form_fields: any[]
  }
}

export default function ConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null)
  const [intakeForm, setIntakeForm] = useState<IntakeFormResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchConsultationDetails(params.id as string)
    }
  }, [params.id])

  const fetchConsultationDetails = async (consultationId: string) => {
    try {
      setLoading(true)
      
      // Fetch consultation details
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultations')
        .select(`
          *,
          appointment:appointments!consultations_appointment_id_fkey(
            id,
            appointment_date,
            start_time,
            end_time,
            status,
            service:services(
              id,
              name,
              duration_minutes,
              price_cents
            )
          ),
          client:profiles!consultations_client_id_fkey(
            id,
            email,
            first_name,
            last_name,
            phone,
            date_of_birth,
            created_at
          )
        `)
        .eq('id', consultationId)
        .single()

      if (consultationError) {
        console.error('Consultation error:', consultationError)
        throw consultationError
      }

      if (!consultationData) {
        throw new Error('Consultation not found')
      }

      setConsultation(consultationData)
      setNotes(consultationData.consultation_notes || '')

      // Fetch intake form response if exists
      if (consultationData.appointment_id) {
        const { data: intakeData, error: intakeError } = await supabase
          .from('intake_form_responses')
          .select(`
            *,
            intake_form:intake_forms(
              name,
              form_fields
            )
          `)
          .eq('appointment_id', consultationData.appointment_id)
          .single()

        if (!intakeError && intakeData) {
          setIntakeForm(intakeData)
        }
      }
    } catch (error) {
      console.error('Error fetching consultation details:', error)
      toast.error('Failed to load consultation details')
    } finally {
      setLoading(false)
    }
  }

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />
      case 'phone':
        return <Phone className="h-5 w-5" />
      case 'in_person':
        return <Users className="h-5 w-5" />
      default:
        return <MessageSquare className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'secondary' as const, label: 'Scheduled' },
      in_progress: { variant: 'default' as const, label: 'In Progress' },
      completed: { variant: 'success' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      no_show: { variant: 'destructive' as const, label: 'No Show' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleStartConsultation = async () => {
    if (!consultation) return

    try {
      if (consultation.consultation_type === 'video' && consultation.daily_room_url) {
        window.open(consultation.daily_room_url, '_blank')
      }
      
      const { error } = await supabase
        .from('consultations')
        .update({ 
          consultation_status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', consultation.id)

      if (error) throw error

      toast.success('Consultation started')
      fetchConsultationDetails(consultation.id)
    } catch (error) {
      console.error('Error starting consultation:', error)
      toast.error('Failed to start consultation')
    }
  }

  const handleCompleteConsultation = async () => {
    if (!consultation) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('consultations')
        .update({ 
          consultation_status: 'completed',
          completed_at: new Date().toISOString(),
          consultation_notes: notes
        })
        .eq('id', consultation.id)

      if (error) throw error

      toast.success('Consultation completed')
      fetchConsultationDetails(consultation.id)
    } catch (error) {
      console.error('Error completing consultation:', error)
      toast.error('Failed to complete consultation')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!consultation) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('consultations')
        .update({ consultation_notes: notes })
        .eq('id', consultation.id)

      if (error) throw error

      toast.success('Notes saved')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkNoShow = async () => {
    if (!consultation) return

    try {
      const { error } = await supabase
        .from('consultations')
        .update({ consultation_status: 'no_show' })
        .eq('id', consultation.id)

      if (error) throw error

      toast.success('Marked as no-show')
      fetchConsultationDetails(consultation.id)
    } catch (error) {
      console.error('Error updating consultation:', error)
      toast.error('Failed to update consultation')
    }
  }

  const handleSendFollowUpEmail = async () => {
    // TODO: Implement email sending functionality
    toast.info('Follow-up email feature coming soon')
  }

  const handleScheduleFollowUp = () => {
    if (!consultation) return
    router.push(`/dashboard/appointments?client=${consultation.client_id}`)
  }

  if (loading) {
    return (
      <>
        <AdminSiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">Loading consultation details...</div>
        </div>
      </>
    )
  }

  if (!consultation) {
    return (
      <>
        <AdminSiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">Consultation not found</div>
        </div>
      </>
    )
  }

  const duration = consultation.started_at && consultation.completed_at
    ? Math.round((new Date(consultation.completed_at).getTime() - new Date(consultation.started_at).getTime()) / 60000)
    : null

  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Consultation Details</h1>
                  <p className="text-muted-foreground">
                    {consultation.client.first_name} {consultation.client.last_name} • {consultation.appointment.appointment_date ? format(new Date(consultation.appointment.appointment_date), 'MMMM d, yyyy') : 'Date not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {consultation.consultation_status === 'scheduled' && (
                  <>
                    <Button onClick={handleStartConsultation}>
                      <Play className="h-4 w-4 mr-1" />
                      Start Consultation
                    </Button>
                    <Button variant="outline" onClick={handleMarkNoShow}>
                      Mark No-Show
                    </Button>
                  </>
                )}
                {consultation.consultation_status === 'in_progress' && (
                  <Button onClick={handleCompleteConsultation}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete Consultation
                  </Button>
                )}
                {consultation.consultation_status === 'completed' && (
                  <Button variant="outline" onClick={handleScheduleFollowUp}>
                    Schedule Follow-Up
                  </Button>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Consultation Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Consultation Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {getConsultationIcon(consultation.consultation_type)}
                          <span className="capitalize font-medium">
                            {consultation.consultation_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(consultation.consultation_status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Service</Label>
                        <p className="font-medium mt-1">{consultation.appointment.service.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Duration</Label>
                        <p className="font-medium mt-1">
                          {consultation.appointment.service.duration_minutes} minutes
                          {duration && ` (Actual: ${duration} min)`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Date & Time</Label>
                        <p className="font-medium mt-1">
                          {consultation.appointment.appointment_date && consultation.appointment.start_time ? 
                            format(new Date(`${consultation.appointment.appointment_date}T${consultation.appointment.start_time}`), 'MMM d, yyyy • h:mm a') : 
                            'Time not set'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Price</Label>
                        <p className="font-medium mt-1">
                          ${(consultation.appointment.service.price_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {consultation.consultation_type === 'video' && consultation.daily_room_url && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-muted-foreground">Video Room</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(consultation.daily_room_url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open Room
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Room: {consultation.daily_room_name}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Tabs defaultValue="notes" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
                    <TabsTrigger value="intake">Intake Form</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notes</CardTitle>
                        <CardDescription>
                          Document important details from the consultation
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Consultation Notes</Label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter consultation notes, key points discussed, recommendations, and follow-up actions..."
                            rows={8}
                            className="mt-1"
                          />
                        </div>
                        {consultation.client_goals && (
                          <div>
                            <Label className="text-muted-foreground">Client Goals</Label>
                            <p className="mt-1 whitespace-pre-wrap">{consultation.client_goals}</p>
                          </div>
                        )}
                        {consultation.health_overview && (
                          <div>
                            <Label className="text-muted-foreground">Health Overview</Label>
                            <p className="mt-1 whitespace-pre-wrap">{consultation.health_overview}</p>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSaveNotes}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save Notes'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="intake" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Intake Form Response</CardTitle>
                        <CardDescription>
                          {intakeForm ? intakeForm.intake_form.name : 'No intake form submitted'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {intakeForm ? (
                          <div className="space-y-4">
                            {intakeForm.intake_form.form_fields.map((field: any, index: number) => {
                              const response = intakeForm.form_data[field.id]
                              if (!response) return null

                              return (
                                <div key={field.id}>
                                  <Label className="text-muted-foreground">{field.label}</Label>
                                  <p className="mt-1">
                                    {Array.isArray(response) ? response.join(', ') : response}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No intake form was submitted for this consultation.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column - Client Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium mt-1">
                        {consultation.client.first_name} {consultation.client.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium mt-1">{consultation.client.email}</p>
                    </div>
                    {consultation.client.phone && (
                      <div>
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="font-medium mt-1">{consultation.client.phone}</p>
                      </div>
                    )}
                    {consultation.client.date_of_birth && (
                      <div>
                        <Label className="text-muted-foreground">Date of Birth</Label>
                        <p className="font-medium mt-1">
                          {consultation.client.date_of_birth ? format(new Date(consultation.client.date_of_birth), 'MMMM d, yyyy') : 'Not provided'}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Client Since</Label>
                      <p className="font-medium mt-1">
                        {format(new Date(consultation.client.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/dashboard/clients/${consultation.client_id}`}>
                          View Full Profile
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleSendFollowUpEmail}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send Follow-Up Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleScheduleFollowUp}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule Follow-Up
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}