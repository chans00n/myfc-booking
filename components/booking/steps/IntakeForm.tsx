"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const intakeFormSchema = z.object({
  healthConditions: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  massageExperience: z.string().optional(),
  pressurePreference: z.enum(["light", "medium", "firm", "deep"]),
  focusAreas: z.string().optional(),
  avoidAreas: z.string().optional(),
  goals: z.string().optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Valid phone number is required"),
});

type IntakeFormData = z.infer<typeof intakeFormSchema>;

interface IntakeFormProps {
  onValidate: (isValid: boolean) => void;
}

export function IntakeForm({ onValidate }: IntakeFormProps) {
  const { bookingData, updateBookingData } = useBooking();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    mode: "onChange",
    defaultValues: bookingData.intakeForm || {
      pressurePreference: "medium",
    },
  });

  const formValues = watch();

  useEffect(() => {
    onValidate(isValid);
  }, [isValid, onValidate]);

  useEffect(() => {
    if (isValid) {
      updateBookingData({ intakeForm: formValues });
    }
  }, [
    isValid,
    formValues.healthConditions,
    formValues.medications,
    formValues.allergies,
    formValues.massageExperience,
    formValues.pressurePreference,
    formValues.focusAreas,
    formValues.avoidAreas,
    formValues.goals,
    formValues.emergencyContactName,
    formValues.emergencyContactPhone,
    updateBookingData,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Health Information</h2>
        <p className="text-gray-600">Help us provide the best massage experience for you</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This information is confidential and will only be used to ensure your safety and comfort
          during your massage.
        </AlertDescription>
      </Alert>

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
            <CardDescription>
              Please list any relevant medical conditions or concerns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="healthConditions">Health Conditions</Label>
              <Textarea
                id="healthConditions"
                placeholder="e.g., High blood pressure, diabetes, recent injuries..."
                {...register("healthConditions")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                placeholder="List any medications you're currently taking..."
                {...register("medications")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                placeholder="e.g., Latex, specific oils, fragrances..."
                {...register("allergies")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Massage Preferences</CardTitle>
            <CardDescription>Help us customize your massage experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="massageExperience">Previous Massage Experience</Label>
              <Textarea
                id="massageExperience"
                placeholder="How often do you get massages? Any specific techniques you prefer?"
                {...register("massageExperience")}
              />
            </div>

            <div className="space-y-2">
              <Label>Pressure Preference</Label>
              <RadioGroup
                value={formValues.pressurePreference}
                onValueChange={(value) => setValue("pressurePreference", value as any)}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="firm" id="firm" />
                    <Label htmlFor="firm">Firm</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deep" id="deep" />
                    <Label htmlFor="deep">Deep</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="focusAreas">Areas to Focus On</Label>
              <Textarea
                id="focusAreas"
                placeholder="e.g., Lower back, shoulders, neck..."
                {...register("focusAreas")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avoidAreas">Areas to Avoid</Label>
              <Textarea
                id="avoidAreas"
                placeholder="Any areas we should avoid or be gentle with?"
                {...register("avoidAreas")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Goals for This Session</Label>
              <Textarea
                id="goals"
                placeholder="What would you like to achieve from this massage?"
                {...register("goals")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>Required for your safety</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input id="emergencyContactName" {...register("emergencyContactName")} />
                {errors.emergencyContactName && (
                  <p className="text-sm text-red-500">{errors.emergencyContactName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  {...register("emergencyContactPhone")}
                />
                {errors.emergencyContactPhone && (
                  <p className="text-sm text-red-500">{errors.emergencyContactPhone.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
