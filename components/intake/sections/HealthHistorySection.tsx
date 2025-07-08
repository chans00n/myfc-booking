"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import type { IntakeFormData, MedicalCondition, Surgery, Injury } from "@/types/intake-forms";

interface HealthHistorySectionProps {
  form: UseFormReturn<IntakeFormData>;
}

export function HealthHistorySection({ form }: HealthHistorySectionProps) {
  const { watch, setValue } = form;
  const medicalConditions = watch("medicalConditions");
  const surgeries = watch("surgeries");
  const injuries = watch("injuries");

  const addMedicalCondition = () => {
    const newCondition: MedicalCondition = {
      condition: "",
      yearDiagnosed: "",
      currentlyTreated: false,
      notes: "",
    };
    setValue("medicalConditions", [...medicalConditions, newCondition]);
  };

  const removeMedicalCondition = (index: number) => {
    setValue(
      "medicalConditions",
      medicalConditions.filter((_, i) => i !== index)
    );
  };

  const updateMedicalCondition = (index: number, field: keyof MedicalCondition, value: any) => {
    const updated = [...medicalConditions];
    updated[index] = { ...updated[index], [field]: value };
    setValue("medicalConditions", updated);
  };

  const addSurgery = () => {
    const newSurgery: Surgery = {
      procedure: "",
      year: "",
      complications: "",
    };
    setValue("surgeries", [...surgeries, newSurgery]);
  };

  const removeSurgery = (index: number) => {
    setValue(
      "surgeries",
      surgeries.filter((_, i) => i !== index)
    );
  };

  const updateSurgery = (index: number, field: keyof Surgery, value: string) => {
    const updated = [...surgeries];
    updated[index] = { ...updated[index], [field]: value };
    setValue("surgeries", updated);
  };

  const addInjury = () => {
    const newInjury: Injury = {
      description: "",
      date: "",
      currentlyAffects: false,
      notes: "",
    };
    setValue("injuries", [...injuries, newInjury]);
  };

  const removeInjury = (index: number) => {
    setValue(
      "injuries",
      injuries.filter((_, i) => i !== index)
    );
  };

  const updateInjury = (index: number, field: keyof Injury, value: any) => {
    const updated = [...injuries];
    updated[index] = { ...updated[index], [field]: value };
    setValue("injuries", updated);
  };

  return (
    <div className="space-y-6">
      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Conditions</CardTitle>
          <CardDescription>
            Please list any medical conditions you have been diagnosed with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicalConditions.map((condition, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Input
                        value={condition.condition}
                        onChange={(e) => updateMedicalCondition(index, "condition", e.target.value)}
                        placeholder="e.g., High blood pressure"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year Diagnosed</Label>
                      <Input
                        value={condition.yearDiagnosed || ""}
                        onChange={(e) =>
                          updateMedicalCondition(index, "yearDiagnosed", e.target.value)
                        }
                        placeholder="e.g., 2020"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={condition.currentlyTreated}
                      onCheckedChange={(checked) =>
                        updateMedicalCondition(index, "currentlyTreated", checked)
                      }
                    />
                    <Label>Currently being treated</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={condition.notes || ""}
                      onChange={(e) => updateMedicalCondition(index, "notes", e.target.value)}
                      placeholder="Any additional information..."
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedicalCondition(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addMedicalCondition} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Medical Condition
          </Button>
        </CardContent>
      </Card>

      {/* Surgeries */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Surgeries</CardTitle>
          <CardDescription>Please list any surgeries you have had</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {surgeries.map((surgery, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Procedure</Label>
                      <Input
                        value={surgery.procedure}
                        onChange={(e) => updateSurgery(index, "procedure", e.target.value)}
                        placeholder="e.g., Knee replacement"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        value={surgery.year || ""}
                        onChange={(e) => updateSurgery(index, "year", e.target.value)}
                        placeholder="e.g., 2019"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Complications or ongoing issues</Label>
                    <Textarea
                      value={surgery.complications || ""}
                      onChange={(e) => updateSurgery(index, "complications", e.target.value)}
                      placeholder="Any complications or ongoing issues..."
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSurgery(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSurgery} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Surgery
          </Button>
        </CardContent>
      </Card>

      {/* Injuries */}
      <Card>
        <CardHeader>
          <CardTitle>Past Injuries</CardTitle>
          <CardDescription>
            Please list any significant injuries you have experienced
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {injuries.map((injury, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Injury Description</Label>
                      <Input
                        value={injury.description}
                        onChange={(e) => updateInjury(index, "description", e.target.value)}
                        placeholder="e.g., Whiplash from car accident"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Injury</Label>
                      <Input
                        value={injury.date || ""}
                        onChange={(e) => updateInjury(index, "date", e.target.value)}
                        placeholder="e.g., 2018"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={injury.currentlyAffects}
                      onCheckedChange={(checked) =>
                        updateInjury(index, "currentlyAffects", checked)
                      }
                    />
                    <Label>Still affects me today</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>How it affects you</Label>
                    <Textarea
                      value={injury.notes || ""}
                      onChange={(e) => updateInjury(index, "notes", e.target.value)}
                      placeholder="Describe any ongoing pain or limitations..."
                      rows={2}
                    />
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeInjury(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addInjury} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Injury
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
