'use client'

import { UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import type { IntakeFormData } from '@/types/intake-forms'

interface GoalsSectionProps {
  form: UseFormReturn<IntakeFormData>
}

const TREATMENT_GOALS = [
  { id: 'pain-relief', label: 'Pain relief', description: 'Reduce chronic or acute pain' },
  { id: 'stress-reduction', label: 'Stress reduction', description: 'Relax and reduce stress levels' },
  { id: 'improved-mobility', label: 'Improved mobility', description: 'Increase range of motion and flexibility' },
  { id: 'injury-recovery', label: 'Injury recovery', description: 'Support healing from injury' },
  { id: 'athletic-performance', label: 'Athletic performance', description: 'Enhance sports performance and recovery' },
  { id: 'better-sleep', label: 'Better sleep', description: 'Improve sleep quality' },
  { id: 'general-wellness', label: 'General wellness', description: 'Maintain overall health and wellbeing' },
  { id: 'prenatal-support', label: 'Prenatal support', description: 'Support during pregnancy' },
  { id: 'posture-improvement', label: 'Posture improvement', description: 'Correct postural imbalances' },
  { id: 'headache-relief', label: 'Headache relief', description: 'Reduce frequency or intensity of headaches' }
]

export function GoalsSection({ form }: GoalsSectionProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const treatmentGoals = watch('treatmentGoals') || ''
  const specificConcerns = watch('specificConcerns') || ''

  const selectedGoals = treatmentGoals.split(',').filter(g => g.trim())

  const toggleGoal = (goalId: string, goalLabel: string) => {
    const goals = selectedGoals.filter(g => g.trim())
    const goalIndex = goals.findIndex(g => g.includes(goalLabel))
    
    if (goalIndex > -1) {
      goals.splice(goalIndex, 1)
    } else {
      goals.push(goalLabel)
    }
    
    setValue('treatmentGoals', goals.join(', '))
  }

  const isGoalSelected = (goalLabel: string) => {
    return selectedGoals.some(g => g.includes(goalLabel))
  }

  return (
    <div className="space-y-6">
      {/* Treatment Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Goals</CardTitle>
          <CardDescription>
            What would you like to achieve through massage therapy? Select all that apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TREATMENT_GOALS.map((goal) => (
              <div key={goal.id} className="flex items-start space-x-3">
                <Checkbox
                  id={goal.id}
                  checked={isGoalSelected(goal.label)}
                  onCheckedChange={() => toggleGoal(goal.id, goal.label)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor={goal.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {goal.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {goal.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {errors.treatmentGoals && (
            <p className="text-sm text-destructive">{errors.treatmentGoals.message}</p>
          )}

          <div className="space-y-2 pt-4">
            <Label htmlFor="treatmentGoalsCustom">Other goals or additional details</Label>
            <Textarea
              id="treatmentGoalsCustom"
              value={treatmentGoals}
              onChange={(e) => setValue('treatmentGoals', e.target.value)}
              placeholder="Feel free to add any other goals or elaborate on your selections..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Specific Concerns */}
      <Card>
        <CardHeader>
          <CardTitle>Specific Concerns</CardTitle>
          <CardDescription>
            Is there anything specific you'd like your massage therapist to know or focus on?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('specificConcerns')}
            placeholder="For example: 'I have tension in my shoulders from computer work' or 'I'm training for a marathon and need focus on legs'..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Session Expectations */}
      <Card>
        <CardHeader>
          <CardTitle>Session Expectations</CardTitle>
          <CardDescription>
            Help us create the best experience for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">During your session:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Communication is key - please tell us if pressure needs adjustment</li>
                <li>• You're always in control - we'll respect your comfort level</li>
                <li>• Feel free to ask questions at any time</li>
                <li>• Let us know immediately if you experience any discomfort</li>
              </ul>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">After your session:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Drink plenty of water to help flush toxins</li>
                <li>• Some soreness is normal, especially after deep tissue work</li>
                <li>• Rest and allow your body to integrate the work</li>
                <li>• Follow any specific recommendations from your therapist</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}