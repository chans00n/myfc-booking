'use client'

import { useState, useEffect } from 'react'
import { AdminSiteHeader } from '@/components/admin-site-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Users, Search, Eye, Phone, Mail, Calendar, CreditCard, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ClientWithStats extends Profile {
  appointmentCount?: number
  lastAppointment?: string
  totalSpent?: number
}

interface IntakeForm {
  id: string
  form_type: string
  status: string
  created_at: string
  data: any
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [clientAppointments, setClientAppointments] = useState<any[]>([])
  const [clientIntakeForms, setClientIntakeForms] = useState<IntakeForm[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setLoading(true)
    try {
      // Fetch all clients directly using client-side Supabase
      const { data: clientsData, error: clientsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (clientsError) throw clientsError
      
      // Fetch additional stats for each client
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          const { data: appointments, error } = await supabase
            .from('appointments')
            .select('appointment_date, total_price_cents, status')
            .eq('client_id', client.id)
            .order('appointment_date', { ascending: false })

          if (error) {
            console.error('Error fetching appointments:', error)
            return client
          }

          const completedAppointments = appointments.filter(apt => apt.status === 'completed')
          const totalSpent = completedAppointments.reduce((sum, apt) => sum + (apt.total_price_cents || 0), 0)

          return {
            ...client,
            appointmentCount: appointments.length,
            lastAppointment: appointments[0]?.appointment_date,
            totalSpent,
          }
        })
      )

      setClients(clientsWithStats)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientDetails = async (clientId: string) => {
    setLoadingDetails(true)
    try {
      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services!appointments_service_id_fkey(
            id,
            name,
            duration_minutes,
            price_cents
          )
        `)
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: false })

      if (appointmentsError) throw appointmentsError
      setClientAppointments(appointments || [])

      // Fetch intake forms
      const { data: intakeForms, error: formsError } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (formsError) throw formsError
      setClientIntakeForms(intakeForms || [])
    } catch (error) {
      console.error('Error fetching client details:', error)
      toast.error('Failed to load client details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' || 
      client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const handleViewDetails = async (client: ClientWithStats) => {
    setSelectedClient(client)
    setShowDetails(true)
    await fetchClientDetails(client.id)
  }

  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage your client database
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{clients.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {clients.filter(c => {
                        if (!c.lastAppointment) return false
                        const lastDate = new Date(c.lastAppointment)
                        const now = new Date()
                        return lastDate.getMonth() === now.getMonth() && 
                               lastDate.getFullYear() === now.getFullYear()
                      }).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPrice(clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Clients Table */}
              <Card>
                <CardHeader>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Users className="h-12 w-12 mb-4" />
                      <p>No clients found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Appointments</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead>Total Spent</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredClients.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {client.first_name} {client.last_name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">{client.email}</div>
                                  {client.phone && (
                                    <div className="text-sm text-muted-foreground">{client.phone}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {client.appointmentCount || 0}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {client.lastAppointment ? (
                                  <div className="text-sm">
                                    {format(new Date(client.lastAppointment), 'MMM d, yyyy')}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Never</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {formatPrice(client.totalSpent || 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(client)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Client Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              View client information and appointment history
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </p>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <p className="text-sm">
                    {format(new Date(selectedClient.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedClient.email}</p>
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedClient.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Total Appointments</Label>
                  <p className="text-2xl font-bold">{selectedClient.appointmentCount || 0}</p>
                </div>
                <div>
                  <Label>Total Spent</Label>
                  <p className="text-2xl font-bold">{formatPrice(selectedClient.totalSpent || 0)}</p>
                </div>
                <div>
                  <Label>Average Spent</Label>
                  <p className="text-2xl font-bold">
                    {selectedClient.appointmentCount && selectedClient.appointmentCount > 0
                      ? formatPrice((selectedClient.totalSpent || 0) / selectedClient.appointmentCount)
                      : '$0.00'}
                  </p>
                </div>
              </div>

              {/* Tabs for Appointments and Intake Forms */}
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appointments">
                    <Calendar className="h-4 w-4 mr-2" />
                    Appointments ({clientAppointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="intake-forms">
                    <FileText className="h-4 w-4 mr-2" />
                    Intake Forms ({clientIntakeForms.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="appointments" className="mt-4">
                  <div>
                    <h3 className="font-semibold mb-3">Appointment History</h3>
                    {loadingDetails ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : clientAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No appointments found
                      </p>
                    ) : (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Amount</TableHead>
                            </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>{appointment.service?.name}</TableCell>
                            <TableCell>
                              <Badge variant={
                                appointment.status === 'completed' ? 'outline' :
                                appointment.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }>
                                {appointment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatPrice(appointment.total_price_cents || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                  </div>
                </TabsContent>
                
                <TabsContent value="intake-forms" className="mt-4">
                  <div>
                    <h3 className="font-semibold mb-3">Submitted Intake Forms</h3>
                    {loadingDetails ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : clientIntakeForms.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No intake forms found
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {clientIntakeForms.map((form) => (
                          <Card key={form.id} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium capitalize">
                                  {form.form_type.replace('_', ' ')} Form
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Submitted on {format(new Date(form.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <Badge variant={
                                form.status === 'submitted' ? 'default' :
                                form.status === 'reviewed' ? 'secondary' :
                                'outline'
                              }>
                                {form.status}
                              </Badge>
                            </div>
                            
                            {/* Display key form data */}
                            {form.form_type === 'health' && form.data && (
                              <div className="text-sm space-y-2">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div>
                                    <span className="font-medium">Emergency Contact:</span>
                                    <p className="text-muted-foreground">
                                      {form.data.emergency_contact_name} ({form.data.emergency_contact_phone})
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Primary Concern:</span>
                                    <p className="text-muted-foreground">{form.data.primary_concern || 'Not specified'}</p>
                                  </div>
                                </div>
                                {form.data.medications && (
                                  <div>
                                    <span className="font-medium">Medications:</span>
                                    <p className="text-muted-foreground">{form.data.medications}</p>
                                  </div>
                                )}
                                {form.data.allergies && (
                                  <div>
                                    <span className="font-medium">Allergies:</span>
                                    <p className="text-muted-foreground">{form.data.allergies}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {form.form_type === 'consent' && form.data && (
                              <div className="text-sm space-y-2">
                                <div>
                                  <span className="font-medium">Consent Given:</span>
                                  <p className="text-muted-foreground">
                                    {form.data.consent_to_treatment ? 'Yes' : 'No'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">Signature:</span>
                                  <p className="text-muted-foreground">{form.data.signature}</p>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}