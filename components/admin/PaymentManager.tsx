'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { 
  DollarSign, 
  RefreshCw, 
  Receipt, 
  Mail, 
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard
} from 'lucide-react'
import { refundPayment } from '@/lib/payments/client-refunds'
import { emailReceipt } from '@/lib/payments/client-receipts'
import type { Payment, PaymentStatus } from '@/types/payments'

export function PaymentManager() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('requested_by_customer')
  const [refundNote, setRefundNote] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadPayments()
  }, [statusFilter])

  const loadPayments = async () => {
    setLoading(true)
    
    try {
      const url = `/api/admin/payments${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load payments')
      }
      
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      toast({
        title: 'Error loading payments',
        description: error instanceof Error ? error.message : 'Failed to load payments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedPayment) return
    
    const amountCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined
    
    const { success, error } = await refundPayment({
      payment_id: selectedPayment.id,
      amount_cents: amountCents,
      reason: refundReason
    })
    
    if (success) {
      toast({
        title: 'Refund processed',
        description: 'The refund has been initiated successfully'
      })
      setRefundDialogOpen(false)
      loadPayments()
    } else {
      toast({
        title: 'Refund failed',
        description: error || 'Failed to process refund',
        variant: 'destructive'
      })
    }
  }


  const handleSendReceipt = async (payment: Payment) => {
    const { success, error } = await emailReceipt(payment.id)
    
    if (success) {
      toast({
        title: 'Receipt sent',
        description: 'Receipt has been emailed to the client'
      })
    } else {
      toast({
        title: 'Failed to send receipt',
        description: error || 'Error sending receipt',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-primary-foreground" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'refunded':
      case 'partially_refunded':
        return <RefreshCw className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      succeeded: 'default',
      processing: 'secondary',
      failed: 'destructive',
      canceled: 'outline',
      pending: 'outline',
      refunded: 'secondary',
      partially_refunded: 'secondary'
    }
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Management</h2>
        <p className="text-muted-foreground">
          View and manage all payments, process refunds, and send receipts
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Overview</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const response = await fetch('/api/payments/fix-status', {
              method: 'POST'
            })
            const result = await response.json()
            if (response.ok) {
              toast({
                title: 'Status fix complete',
                description: `Processed ${result.processed} payments`
              })
              loadPayments()
            } else {
              toast({
                title: 'Fix failed',
                description: result.error,
                variant: 'destructive'
              })
            }
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Fix Payment Statuses
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">
              ${payments
                .filter(p => p.status === 'succeeded')
                .reduce((sum, p) => sum + (p.amount_cents - p.refunded_amount_cents) / 100, 0)
                .toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Successful Payments</CardDescription>
            <CardTitle className="text-2xl">
              {payments.filter(p => p.status === 'succeeded').length}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">
              {payments.filter(p => p.status === 'pending' || p.status === 'processing').length}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Refunded</CardDescription>
            <CardTitle className="text-2xl">
              ${payments
                .reduce((sum, p) => sum + p.refunded_amount_cents / 100, 0)
                .toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="succeeded">Succeeded</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
        </TabsList>
        
        <TabsContent value={statusFilter} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading payments...
                      </TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {payment.appointment?.client?.first_name} {payment.appointment?.client?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.appointment?.client?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{payment.appointment?.service?.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${(payment.amount_cents / 100).toFixed(2)}</p>
                            {payment.refunded_amount_cents > 0 && (
                              <p className="text-sm text-orange-600">
                                Refunded: ${(payment.refunded_amount_cents / 100).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.receipt_number || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedPayment(payment)
                                setReceiptDialogOpen(true)
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.status === 'succeeded' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSendReceipt(payment)}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                {payment.refunded_amount_cents < payment.amount_cents && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedPayment(payment)
                                      setRefundAmount('')
                                      setRefundReason('requested_by_customer')
                                      setRefundNote('')
                                      setRefundDialogOpen(true)
                                    }}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Issue a full or partial refund for this payment
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <Label>Payment Amount</Label>
                <p className="text-2xl font-bold">
                  ${(selectedPayment.amount_cents / 100).toFixed(2)}
                </p>
                {selectedPayment.refunded_amount_cents > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Already refunded: ${(selectedPayment.refunded_amount_cents / 100).toFixed(2)}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="refund-amount">Refund Amount (leave empty for full refund)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  placeholder={`Max: $${((selectedPayment.amount_cents - selectedPayment.refunded_amount_cents) / 100).toFixed(2)}`}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="refund-reason">Refund Reason (Stripe)</Label>
                <Select value={refundReason} onValueChange={setRefundReason}>
                  <SelectTrigger id="refund-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested_by_customer">Requested by Customer</SelectItem>
                    <SelectItem value="duplicate">Duplicate Payment</SelectItem>
                    <SelectItem value="fraudulent">Fraudulent Payment</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This reason will be sent to Stripe
                </p>
              </div>
              
              <div>
                <Label htmlFor="refund-note">Internal Notes (Optional)</Label>
                <Textarea
                  id="refund-note"
                  placeholder="Add any additional notes about this refund"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete payment information and transaction history
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Payment ID</Label>
                    <p className="font-mono text-sm">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stripe Payment Intent</Label>
                    <p className="font-mono text-sm">{selectedPayment.stripe_payment_intent_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Receipt Number</Label>
                    <p className="font-medium">{selectedPayment.receipt_number || 'Not generated'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Financial Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="text-2xl font-bold">${(selectedPayment.amount_cents / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Currency</Label>
                    <p className="text-lg">{selectedPayment.currency.toUpperCase()}</p>
                  </div>
                  {selectedPayment.refunded_amount_cents > 0 && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Refunded Amount</Label>
                        <p className="text-lg text-orange-600">${(selectedPayment.refunded_amount_cents / 100).toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Net Amount</Label>
                        <p className="text-lg font-semibold">${((selectedPayment.amount_cents - selectedPayment.refunded_amount_cents) / 100).toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Client & Appointment Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Client & Appointment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Client Name</Label>
                    <p className="font-medium">
                      {selectedPayment.appointment?.client?.first_name} {selectedPayment.appointment?.client?.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm">{selectedPayment.appointment?.client?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Service</Label>
                    <p className="font-medium">{selectedPayment.appointment?.service?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Appointment Date</Label>
                    <p>
                      {selectedPayment.appointment?.appointment_date && 
                        format(new Date(selectedPayment.appointment.appointment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              {selectedPayment.payment_method_type && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="capitalize">{selectedPayment.payment_method_type}</p>
                    </div>
                    {selectedPayment.payment_method_last4 && (
                      <div>
                        <Label className="text-muted-foreground">Card</Label>
                        <p>•••• {selectedPayment.payment_method_last4}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{format(new Date(selectedPayment.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  {selectedPayment.paid_at && (
                    <div>
                      <Label className="text-muted-foreground">Paid</Label>
                      <p>{format(new Date(selectedPayment.paid_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                  {selectedPayment.refunded_at && (
                    <div>
                      <Label className="text-muted-foreground">Refunded</Label>
                      <p>{format(new Date(selectedPayment.refunded_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p>{format(new Date(selectedPayment.updated_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
              </div>

              {/* Payment Events Timeline */}
              {selectedPayment.payment_events && selectedPayment.payment_events.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Event History</h3>
                  <div className="space-y-2">
                    {selectedPayment.payment_events
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((event) => (
                        <div key={event.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.created_at), 'MMM d, yyyy h:mm:ss a')}
                              </p>
                            </div>
                            {event.error_message && (
                              <p className="text-xs text-red-600 mt-1">Error: {event.error_message}</p>
                            )}
                            {event.stripe_event_id && (
                              <p className="text-xs text-muted-foreground mt-1">Stripe Event: {event.stripe_event_id}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(selectedPayment.description || selectedPayment.metadata || selectedPayment.error_message) && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Additional Information</h3>
                  {selectedPayment.description && (
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm">{selectedPayment.description}</p>
                    </div>
                  )}
                  {selectedPayment.error_message && (
                    <div>
                      <Label className="text-muted-foreground">Error Message</Label>
                      <p className="text-sm text-red-600">{selectedPayment.error_message}</p>
                    </div>
                  )}
                  {selectedPayment.metadata && Object.keys(selectedPayment.metadata).length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Metadata</Label>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(selectedPayment.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Stripe Receipt */}
              {selectedPayment.receipt_url && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm font-medium">Stripe Receipt Available</span>
                  </div>
                  <a 
                    href={selectedPayment.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    View Receipt →
                  </a>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
            {selectedPayment?.status === 'succeeded' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSendReceipt(selectedPayment)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Receipt
                </Button>
                {selectedPayment.refunded_amount_cents < selectedPayment.amount_cents && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReceiptDialogOpen(false)
                      setRefundAmount('')
                      setRefundReason('requested_by_customer')
                      setRefundNote('')
                      setRefundDialogOpen(true)
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Process Refund
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}