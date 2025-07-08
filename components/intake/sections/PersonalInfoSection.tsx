"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { IntakeFormData } from "@/types/intake-forms";

interface PersonalInfoSectionProps {
  form: UseFormReturn<IntakeFormData>;
}

export function PersonalInfoSection({ form }: PersonalInfoSectionProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>
            This information helps us provide you with the best care
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register("firstName")} placeholder="John" />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register("lastName")} placeholder="Doe" />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" {...register("phone")} placeholder="(555) 123-4567" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Who should we contact in case of an emergency?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact Name *</Label>
            <Input
              id="emergencyContactName"
              {...register("emergencyContactName")}
              placeholder="Jane Doe"
            />
            {errors.emergencyContactName && (
              <p className="text-sm text-destructive">{errors.emergencyContactName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                {...register("emergencyContactPhone")}
                placeholder="(555) 987-6543"
              />
              {errors.emergencyContactPhone && (
                <p className="text-sm text-destructive">{errors.emergencyContactPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
              <Input
                id="emergencyContactRelationship"
                {...register("emergencyContactRelationship")}
                placeholder="Spouse, Parent, Friend, etc."
              />
              {errors.emergencyContactRelationship && (
                <p className="text-sm text-destructive">
                  {errors.emergencyContactRelationship.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
