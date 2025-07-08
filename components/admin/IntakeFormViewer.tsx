'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { IntakeForm } from '@/types/intake-forms'
import { format } from 'date-fns'

interface IntakeFormViewerProps {
  form: IntakeForm
}

export function IntakeFormViewer({ form }: IntakeFormViewerProps) {
  // Helper to safely display array data
  const displayArray = (arr: any[] | undefined, field: string = '') => {
    if (!arr || arr.length === 0) return <p className="text-muted-foreground">None reported</p>
    
    return (
      <ul className="space-y-1">
        {arr.map((item, i) => {
          if (typeof item === 'string') {
            return <li key={i}>• {item}</li>
          }
          if (typeof item === 'object' && field && item[field]) {
            return <li key={i}>• {item[field]}</li>
          }
          return null
        })}
      </ul>
    )
  }

  return (
    <div className="space-y-6">
      {/* Form Metadata */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">Form Type</p>
          <Badge variant="outline" className="mt-1">
            {form.form_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="text-sm">
            {form.submitted_at ? format(new Date(form.submitted_at), 'MMM d, yyyy h:mm a') : 'Not submitted'}
          </p>
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p>
                  {(form.client as any)?.first_name && (form.client as any)?.last_name 
                    ? `${(form.client as any).first_name} ${(form.client as any).last_name}`
                    : (form.client as any)?.first_name || (form.client as any)?.last_name || 'Not provided'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p>{(form.client as any)?.date_of_birth ? format(new Date((form.client as any).date_of_birth), 'MMM d, yyyy') : 'Not provided'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="break-all">{(form.client as any)?.email || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p>{(form.client as any)?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p>{form.emergency_contact_name || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p>{form.emergency_contact_phone || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Relationship</Label>
              <p>{form.emergency_contact_relationship || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Medical Conditions</Label>
            {form.medical_conditions && form.medical_conditions.length > 0 ? (
              <ul className="mt-1 space-y-2">
                {form.medical_conditions.map((condition: any, i: number) => (
                  <li key={i} className="border-l-2 pl-3">
                    <p className="font-medium">{condition.condition}</p>
                    {condition.yearDiagnosed && <p className="text-sm text-muted-foreground">Diagnosed: {condition.yearDiagnosed}</p>}
                    {condition.currentlyTreated && <p className="text-sm text-green-600">Currently being treated</p>}
                    {condition.notes && <p className="text-sm">{condition.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None reported</p>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-muted-foreground">Previous Surgeries</Label>
            {form.surgeries && form.surgeries.length > 0 ? (
              <ul className="mt-1 space-y-2">
                {form.surgeries.map((surgery: any, i: number) => (
                  <li key={i} className="border-l-2 pl-3">
                    <p className="font-medium">{surgery.procedure}</p>
                    {surgery.year && <p className="text-sm text-muted-foreground">Year: {surgery.year}</p>}
                    {surgery.complications && <p className="text-sm">{surgery.complications}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None reported</p>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-muted-foreground">Past Injuries</Label>
            {form.injuries && form.injuries.length > 0 ? (
              <ul className="mt-1 space-y-2">
                {form.injuries.map((injury: any, i: number) => (
                  <li key={i} className="border-l-2 pl-3">
                    <p className="font-medium">{injury.description}</p>
                    {injury.date && <p className="text-sm text-muted-foreground">Date: {injury.date}</p>}
                    {injury.currentlyAffects && <p className="text-sm text-orange-600">Still affects today</p>}
                    {injury.notes && <p className="text-sm">{injury.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None reported</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Health Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Overall Pain Level</Label>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{form.pain_level || 0}/10</p>
                <Badge variant={form.pain_level! > 6 ? 'destructive' : form.pain_level! > 3 ? 'secondary' : 'outline'}>
                  {form.pain_level! > 6 ? 'High' : form.pain_level! > 3 ? 'Moderate' : 'Low'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-muted-foreground">Pain Areas</Label>
            {form.pain_areas && form.pain_areas.length > 0 ? (
              <ul className="mt-1 space-y-2">
                {form.pain_areas.map((area: any, i: number) => (
                  <li key={i} className="border-l-2 pl-3">
                    <p className="font-medium">{area.area} - Level {area.painLevel}/10</p>
                    {area.description && <p className="text-sm">{area.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No specific areas reported</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Current Medications</Label>
              {displayArray(form.current_medications)}
            </div>
            <div>
              <Label className="text-muted-foreground">Allergies</Label>
              {displayArray(form.allergies)}
            </div>
          </div>

          {/* Legacy fields if they exist */}
          {form.medications && (
            <div>
              <Label className="text-muted-foreground">Medications (Legacy)</Label>
              <p>{form.medications}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Massage Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Massage Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Previous Experience</Label>
              <p>{form.previous_massage_experience ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Pressure Preference</Label>
              <Badge variant="secondary">
                {form.pressure_preference?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
              </Badge>
            </div>
          </div>

          {form.massage_frequency && (
            <div>
              <Label className="text-muted-foreground">Massage Frequency</Label>
              <p>{form.massage_frequency}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Areas to Avoid</Label>
              {displayArray(form.areas_to_avoid)}
            </div>
            <div>
              <Label className="text-muted-foreground">Preferred Techniques</Label>
              {displayArray(form.preferred_techniques)}
            </div>
          </div>

          {/* Legacy fields */}
          {form.massage_experience && (
            <div>
              <Label className="text-muted-foreground">Experience (Legacy)</Label>
              <p>{form.massage_experience}</p>
            </div>
          )}
          {form.focus_areas && (
            <div>
              <Label className="text-muted-foreground">Focus Areas (Legacy)</Label>
              <p>{form.focus_areas}</p>
            </div>
          )}
          {form.avoid_areas && (
            <div>
              <Label className="text-muted-foreground">Avoid Areas (Legacy)</Label>
              <p>{form.avoid_areas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatment Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Treatment Goals & Concerns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Treatment Goals</Label>
            <p className="whitespace-pre-wrap">{form.treatment_goals || form.goals || 'Not specified'}</p>
          </div>
          {form.specific_concerns && (
            <div>
              <Label className="text-muted-foreground">Specific Concerns</Label>
              <p className="whitespace-pre-wrap">{form.specific_concerns}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent & Signature */}
      {form.consent_signature && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consent & Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Consent Agreements</Label>
              {form.consent_agreements && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(form.consent_agreements).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant={value ? 'default' : 'outline'} className="h-5">
                        {value ? '✓' : '✗'}
                      </Badge>
                      <span className="text-sm">
                        {key.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-muted-foreground">Digital Signature</Label>
              <div className="mt-2 border rounded p-2 bg-muted/10">
                <img 
                  src={form.consent_signature} 
                  alt="Client signature" 
                  className="max-h-24"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Signed on: {form.consent_date ? format(new Date(form.consent_date), 'MMM d, yyyy h:mm a') : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Form Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p>{format(new Date(form.created_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Updated</Label>
              <p>{form.updated_at ? format(new Date(form.updated_at), 'MMM d, yyyy h:mm a') : 'Never'}</p>
            </div>
            {form.reviewed_at && (
              <>
                <div>
                  <Label className="text-muted-foreground">Reviewed</Label>
                  <p>{format(new Date(form.reviewed_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reviewed By</Label>
                  <p>{form.reviewed_by || 'Unknown'}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}