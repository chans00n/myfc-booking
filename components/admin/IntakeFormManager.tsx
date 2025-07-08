'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Eye, 
  Download,
  Search,
  Filter,
  AlertCircle,
  User,
  Calendar
} from 'lucide-react'
import { getFormsForReview, markFormAsReviewed, getIntakeForm } from '@/lib/intake-forms'
import type { IntakeForm, FormStatus } from '@/types/intake-forms'
import { format } from 'date-fns'
import { IntakeFormViewer } from './IntakeFormViewer'

export function IntakeFormManager() {
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<IntakeForm | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadForms()
  }, [statusFilter])

  const loadForms = async () => {
    setLoading(true)
    const { data, error } = await getFormsForReview(
      statusFilter === 'all' ? undefined : statusFilter
    )
    
    if (error) {
      toast({
        title: 'Error loading forms',
        description: error,
        variant: 'destructive'
      })
    } else {
      setForms(data)
    }
    setLoading(false)
  }

  const handleViewForm = async (form: IntakeForm) => {
    const { data, error } = await getIntakeForm(form.id)
    if (error) {
      toast({
        title: 'Error loading form',
        description: error,
        variant: 'destructive'
      })
    } else if (data) {
      setSelectedForm(data)
      setViewDialogOpen(true)
    }
  }

  const handleMarkReviewed = async (formId: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to review forms',
        variant: 'destructive'
      })
      return
    }
    
    const { error } = await markFormAsReviewed(formId, user.id)
    
    if (error) {
      toast({
        title: 'Error marking form as reviewed',
        description: error,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Form marked as reviewed',
        description: 'The form has been successfully reviewed'
      })
      loadForms()
      setViewDialogOpen(false)
    }
  }

  const getStatusBadge = (status: FormStatus) => {
    const variants = {
      draft: { label: 'Draft', variant: 'outline' as const },
      completed: { label: 'Completed', variant: 'secondary' as const },
      submitted: { label: 'Submitted', variant: 'default' as const },
      reviewed: { label: 'Reviewed', variant: 'success' as const }
    }
    
    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getFormTypeBadge = (formType: string) => {
    const types = {
      new_client: { label: 'New Client', icon: User },
      returning_client: { label: 'Returning', icon: FileText },
      quick_update: { label: 'Quick Update', icon: Clock }
    }
    
    const config = types[formType as keyof typeof types] || { label: formType, icon: FileText }
    const Icon = config.icon
    
    return (
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <span className="text-sm">{config.label}</span>
      </div>
    )
  }

  const filteredForms = forms.filter(form => {
    const client = form.client as any
    const searchLower = searchQuery.toLowerCase()
    
    return (
      client?.first_name?.toLowerCase().includes(searchLower) ||
      client?.last_name?.toLowerCase().includes(searchLower) ||
      client?.email?.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: forms.length,
    submitted: forms.filter(f => f.status === 'submitted').length,
    reviewed: forms.filter(f => f.status === 'reviewed').length,
    needsReview: forms.filter(f => f.status === 'submitted').length
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Intake Forms</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Review and manage client intake forms
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Forms</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Submitted</CardDescription>
            <CardTitle className="text-2xl">{stats.submitted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Reviewed</CardDescription>
            <CardTitle className="text-2xl">{stats.reviewed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Needs Review</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{stats.needsReview}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FormStatus | 'all')}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="submitted">Submitted</TabsTrigger>
                <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Forms Table */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading forms...</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No forms found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => {
                    const client = form.client as any
                    return (
                      <TableRow key={form.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {client?.first_name} {client?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getFormTypeBadge(form.form_type)}</TableCell>
                        <TableCell>{getStatusBadge(form.status)}</TableCell>
                        <TableCell>
                          {form.submitted_at ? (
                            <div className="text-sm">
                              <p>{format(new Date(form.submitted_at), 'MMM d, yyyy')}</p>
                              <p className="text-muted-foreground">
                                {format(new Date(form.submitted_at), 'h:mm a')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not submitted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewForm(form)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Form Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Intake Form Details</DialogTitle>
            <DialogDescription>
              Review the complete intake form submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedForm && (
            <ScrollArea className="h-[60vh] pr-4">
              <IntakeFormViewer form={selectedForm} />
            </ScrollArea>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedForm?.status === 'submitted' && (
              <Button onClick={() => handleMarkReviewed(selectedForm.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Reviewed
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}