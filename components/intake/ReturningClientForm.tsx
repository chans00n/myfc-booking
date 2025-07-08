'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClipboardList, FileText, InfoIcon } from 'lucide-react'
import { IntakeForm } from './IntakeForm'
import { QuickUpdateForm } from './QuickUpdateForm'
import { getLatestIntakeForm } from '@/lib/intake-forms'
import type { IntakeForm as IntakeFormType } from '@/types/intake-forms'

interface ReturningClientFormProps {
  formId: string
  clientId: string
  clientProfile?: any
  lastFormDate?: Date
  onComplete?: () => void
}

export function ReturningClientForm({ 
  formId, 
  clientId, 
  clientProfile,
  lastFormDate,
  onComplete 
}: ReturningClientFormProps) {
  const [selectedFormType, setSelectedFormType] = useState<'quick' | 'full'>('quick')
  const [lastIntakeForm, setLastIntakeForm] = useState<IntakeFormType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLastForm() {
      const { data } = await getLatestIntakeForm(clientId)
      setLastIntakeForm(data)
      setLoading(false)
    }
    loadLastForm()
  }, [clientId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading your information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysSinceLastForm = lastFormDate 
    ? Math.floor((new Date().getTime() - lastFormDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome Back!</h1>
        <p className="text-muted-foreground mt-2">
          It's been {daysSinceLastForm} days since your last visit. Please update your health information.
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          {daysSinceLastForm > 90 
            ? "Since it's been over 90 days, we recommend completing a full intake form to ensure we have your most current information."
            : "You can choose to complete a quick update or fill out a comprehensive form."}
        </AlertDescription>
      </Alert>

      <Tabs value={selectedFormType} onValueChange={(v) => setSelectedFormType(v as 'quick' | 'full')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Quick Update
          </TabsTrigger>
          <TabsTrigger value="full" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Full Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-6">
          {lastIntakeForm ? (
            <QuickUpdateForm 
              formId={formId}
              lastIntakeForm={lastIntakeForm}
              onComplete={onComplete}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  We couldn't find your previous intake form. Please complete a full form.
                </p>
                <Button onClick={() => setSelectedFormType('full')}>
                  Complete Full Form
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="full" className="mt-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Comprehensive Intake Form</CardTitle>
              <CardDescription>
                This will replace your previous intake form with updated information
              </CardDescription>
            </CardHeader>
          </Card>
          
          <IntakeForm 
            formId={formId}
            initialData={lastIntakeForm || undefined}
            clientProfile={clientProfile}
            onComplete={onComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}