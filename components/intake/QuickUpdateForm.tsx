"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { InfoIcon, Plus, X } from "lucide-react";
import { updateIntakeForm, submitIntakeForm } from "@/lib/intake-forms";
import { DigitalSignature } from "./DigitalSignature";
import type { IntakeForm } from "@/types/intake-forms";

const quickUpdateSchema = z.object({
  // Changes since last visit
  changesSinceLastVisit: z.string().min(1, "Please describe any changes"),
  newInjuries: z.boolean(),
  injuryDetails: z.string().optional(),
  newMedications: z.array(z.string()).default([]),

  // Current status
  currentPainLevel: z.number().min(0).max(10),
  currentStressLevel: z.number().min(0).max(10),

  // Today's needs
  todaysFocus: z.string().min(1, "Please describe what you need today"),
  areasOfConcern: z.array(z.string()).default([]),

  // Consent
  confirmNoChanges: z.boolean(),
  signature: z.string().optional(),
});

type QuickUpdateData = z.infer<typeof quickUpdateSchema>;

interface QuickUpdateFormProps {
  formId: string;
  lastIntakeForm: IntakeForm;
  onComplete?: () => void;
}

const COMMON_AREAS = [
  "Neck",
  "Shoulders",
  "Upper Back",
  "Lower Back",
  "Hips",
  "Legs",
  "Arms",
  "Head",
];

export function QuickUpdateForm({ formId, lastIntakeForm, onComplete }: QuickUpdateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMedication, setNewMedication] = useState("");
  const { toast } = useToast();

  const form = useForm<QuickUpdateData>({
    resolver: zodResolver(quickUpdateSchema),
    defaultValues: {
      changesSinceLastVisit: "",
      newInjuries: false,
      injuryDetails: "",
      newMedications: [],
      currentPainLevel: 5,
      currentStressLevel: 5,
      todaysFocus: "",
      areasOfConcern: [],
      confirmNoChanges: false,
    },
  });

  const { watch, setValue } = form;
  const newInjuries = watch("newInjuries");
  const currentPainLevel = watch("currentPainLevel");
  const currentStressLevel = watch("currentStressLevel");
  const areasOfConcern = watch("areasOfConcern");
  const newMedications = watch("newMedications");

  const toggleArea = (area: string) => {
    if (areasOfConcern.includes(area)) {
      setValue(
        "areasOfConcern",
        areasOfConcern.filter((a) => a !== area)
      );
    } else {
      setValue("areasOfConcern", [...areasOfConcern, area]);
    }
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setValue("newMedications", [...newMedications, newMedication.trim()]);
      setNewMedication("");
    }
  };

  const removeMedication = (index: number) => {
    setValue(
      "newMedications",
      newMedications.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (data: QuickUpdateData) => {
    if (!data.signature) {
      toast({
        title: "Signature required",
        description: "Please provide your signature to submit the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Update the intake form with quick update data
    const updates = {
      specificConcerns: `Quick Update - ${new Date().toLocaleDateString()}\n\nChanges: ${data.changesSinceLastVisit}\n\nToday's Focus: ${data.todaysFocus}`,
      painAreas: data.areasOfConcern.map((area) => ({
        area,
        painLevel: data.currentPainLevel,
        description: "See quick update notes",
      })),
      overallPainLevel: data.currentPainLevel,
      currentMedications: [...(lastIntakeForm.current_medications || []), ...data.newMedications],
      injuries:
        data.newInjuries && data.injuryDetails
          ? [
              ...(lastIntakeForm.injuries || []),
              {
                description: data.injuryDetails,
                date: new Date().toISOString().split("T")[0],
                currentlyAffects: true,
                notes: "Reported in quick update",
              },
            ]
          : lastIntakeForm.injuries,
    };

    const { error: updateError } = await updateIntakeForm(formId, updates);

    if (updateError) {
      toast({
        title: "Error saving form",
        description: updateError,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Submit with signature
    const { error: submitError } = await submitIntakeForm(formId, data.signature);

    if (submitError) {
      toast({
        title: "Error submitting form",
        description: submitError,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Quick update submitted",
        description: "Thank you for updating your information",
      });
      onComplete?.();
    }

    setIsSubmitting(false);
  };

  const lastVisitDate = lastIntakeForm.submitted_at
    ? new Date(lastIntakeForm.submitted_at).toLocaleDateString()
    : "Unknown";

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quick Health Update</h2>
        <p className="text-muted-foreground">
          Welcome back! Please take a moment to update us on any changes since your last visit on{" "}
          {lastVisitDate}.
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This quick form helps us provide you with the best care. Your previous intake information
          is still on file.
        </AlertDescription>
      </Alert>

      {/* Changes Since Last Visit */}
      <Card>
        <CardHeader>
          <CardTitle>Changes Since Last Visit</CardTitle>
          <CardDescription>
            Have there been any changes to your health, lifestyle, or medications?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="changes">Please describe any changes *</Label>
            <Textarea
              id="changes"
              {...form.register("changesSinceLastVisit")}
              placeholder="e.g., Started new exercise routine, changed jobs, new stress, etc."
              rows={3}
            />
            {form.formState.errors.changesSinceLastVisit && (
              <p className="text-sm text-destructive">
                {form.formState.errors.changesSinceLastVisit.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Any new injuries since your last visit?</Label>
            <RadioGroup
              value={newInjuries ? "yes" : "no"}
              onValueChange={(value) => setValue("newInjuries", value === "yes")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="injuries-yes" />
                <Label htmlFor="injuries-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="injuries-no" />
                <Label htmlFor="injuries-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {newInjuries && (
            <div className="space-y-2">
              <Label htmlFor="injury-details">Please describe the injury</Label>
              <Textarea
                id="injury-details"
                {...form.register("injuryDetails")}
                placeholder="What happened and when? How does it affect you?"
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>New medications</Label>
            {newMedications.map((med, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{med}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedication(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Enter medication name"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMedication();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addMedication}
                disabled={!newMedication.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>How Are You Feeling Today?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Current Pain Level</Label>
              <span className="text-sm font-medium">{currentPainLevel}/10</span>
            </div>
            <Slider
              value={[currentPainLevel]}
              onValueChange={(value) => setValue("currentPainLevel", value[0])}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Current Stress Level</Label>
              <span className="text-sm font-medium">{currentStressLevel}/10</span>
            </div>
            <Slider
              value={[currentStressLevel]}
              onValueChange={(value) => setValue("currentStressLevel", value[0])}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Today's Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Session</CardTitle>
          <CardDescription>What would you like to focus on during today's massage?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Areas of concern</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMMON_AREAS.map((area) => (
                <Button
                  key={area}
                  type="button"
                  variant={areasOfConcern.includes(area) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleArea(area)}
                >
                  {area}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus">What do you need from today's session? *</Label>
            <Textarea
              id="focus"
              {...form.register("todaysFocus")}
              placeholder="e.g., Focus on lower back pain, general relaxation, work on neck tension..."
              rows={3}
            />
            {form.formState.errors.todaysFocus && (
              <p className="text-sm text-destructive">
                {form.formState.errors.todaysFocus.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm"
              checked={watch("confirmNoChanges")}
              onCheckedChange={(checked) => setValue("confirmNoChanges", !!checked)}
            />
            <Label htmlFor="confirm" className="text-sm">
              I confirm that aside from the updates above, all other information in my previous
              intake form remains accurate and unchanged.
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Digital Signature</Label>
            <DigitalSignature
              onSignatureChange={(sig) => setValue("signature", sig || "")}
              initialSignature={watch("signature")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Update"}
        </Button>
      </div>
    </form>
  );
}
