'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DiagnosticTool() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const runDiagnostics = async () => {
    setLoading(true)
    const diagnostics: any = {}

    // Check auth status
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      diagnostics.auth = {
        isAuthenticated: !!user,
        userId: user?.id,
        email: user?.email,
        error: error?.message
      }
    } catch (e) {
      diagnostics.auth = { error: e instanceof Error ? e.message : 'Unknown auth error' }
    }

    // Check profile
    if (diagnostics.auth.userId) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', diagnostics.auth.userId)
          .single()
        
        diagnostics.profile = {
          exists: !!data,
          data,
          error: error?.message
        }
      } catch (e) {
        diagnostics.profile = { error: e instanceof Error ? e.message : 'Unknown profile error' }
      }
    }

    // Test intake form creation
    try {
      const testFormId = crypto.randomUUID()
      const { data, error } = await supabase
        .from('intake_forms')
        .insert({
          id: testFormId,
          client_id: diagnostics.auth.userId,
          form_type: 'new_client',
          status: 'draft'
        })
        .select()
        .single()
      
      diagnostics.intakeFormCreate = {
        success: !!data,
        data,
        error: error?.message,
        errorDetails: error
      }

      // Clean up test form
      if (data) {
        await supabase.from('intake_forms').delete().eq('id', testFormId)
      }
    } catch (e) {
      diagnostics.intakeFormCreate = { error: e instanceof Error ? e.message : 'Unknown error' }
    }

    // Test intake form update
    try {
      // First create a test form
      const testFormId = crypto.randomUUID()
      const { data: createData } = await supabase
        .from('intake_forms')
        .insert({
          id: testFormId,
          client_id: diagnostics.auth.userId,
          form_type: 'new_client',
          status: 'draft'
        })
        .select()
        .single()

      if (createData) {
        // Try to update it
        const { data: updateData, error: updateError } = await supabase
          .from('intake_forms')
          .update({
            emergency_contact_name: 'Test Contact',
            updated_at: new Date().toISOString()
          })
          .eq('id', testFormId)
          .select()
          .single()

        diagnostics.intakeFormUpdate = {
          success: !!updateData,
          data: updateData,
          error: updateError?.message,
          errorDetails: updateError
        }

        // Try to submit it
        const { data: submitData, error: submitError } = await supabase
          .from('intake_forms')
          .update({
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', testFormId)
          .select()
          .single()

        diagnostics.intakeFormSubmit = {
          success: !!submitData,
          data: submitData,
          error: submitError?.message,
          errorDetails: submitError
        }

        // Clean up
        await supabase.from('intake_forms').delete().eq('id', testFormId)
      }
    } catch (e) {
      diagnostics.intakeFormUpdate = { error: e instanceof Error ? e.message : 'Unknown error' }
    }

    // Check database connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      diagnostics.database = {
        connected: !error,
        error: error?.message
      }
    } catch (e) {
      diagnostics.database = { error: e instanceof Error ? e.message : 'Unknown database error' }
    }

    setResults(diagnostics)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Diagnostic Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            {Object.entries(results).map(([key, value]) => (
              <Alert key={key} variant={value.error ? 'destructive' : 'default'}>
                <AlertDescription>
                  <strong>{key}:</strong>
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}