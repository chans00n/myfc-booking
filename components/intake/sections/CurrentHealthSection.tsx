"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import type { IntakeFormData, PainArea } from "@/types/intake-forms";

interface CurrentHealthSectionProps {
  form: UseFormReturn<IntakeFormData>;
}

const BODY_AREAS = [
  "Head",
  "Neck",
  "Shoulders",
  "Upper Back",
  "Mid Back",
  "Lower Back",
  "Chest",
  "Abdomen",
  "Hips",
  "Arms",
  "Hands",
  "Legs",
  "Feet",
];

export function CurrentHealthSection({ form }: CurrentHealthSectionProps) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = form;
  const painAreas = watch("painAreas");
  const overallPainLevel = watch("overallPainLevel");
  const currentMedications = watch("currentMedications");
  const allergies = watch("allergies");

  const addPainArea = (area: string) => {
    const newPainArea: PainArea = {
      area,
      painLevel: 5,
      description: "",
    };
    setValue("painAreas", [...painAreas, newPainArea]);
  };

  const removePainArea = (index: number) => {
    setValue(
      "painAreas",
      painAreas.filter((_, i) => i !== index)
    );
  };

  const updatePainArea = (index: number, field: keyof PainArea, value: any) => {
    const updated = [...painAreas];
    updated[index] = { ...updated[index], [field]: value };
    setValue("painAreas", updated);
  };

  const isPainAreaSelected = (area: string) => {
    return painAreas.some((pa) => pa.area === area);
  };

  const addMedication = (medication: string) => {
    if (medication.trim()) {
      setValue("currentMedications", [...currentMedications, medication.trim()]);
    }
  };

  const removeMedication = (index: number) => {
    setValue(
      "currentMedications",
      currentMedications.filter((_, i) => i !== index)
    );
  };

  const addAllergy = (allergy: string) => {
    if (allergy.trim()) {
      setValue("allergies", [...allergies, allergy.trim()]);
    }
  };

  const removeAllergy = (index: number) => {
    setValue(
      "allergies",
      allergies.filter((_, i) => i !== index)
    );
  };

  const [newMedication, setNewMedication] = useState("");
  const [newAllergy, setNewAllergy] = useState("");

  return (
    <div className="space-y-6">
      {/* Pain Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Areas of Pain or Discomfort</CardTitle>
          <CardDescription>
            Select all areas where you experience pain or discomfort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BODY_AREAS.map((area) => (
              <Button
                key={area}
                type="button"
                variant={isPainAreaSelected(area) ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  if (!isPainAreaSelected(area)) {
                    addPainArea(area);
                  }
                }}
                disabled={isPainAreaSelected(area)}
              >
                {area}
              </Button>
            ))}
          </div>

          {painAreas.length > 0 && (
            <div className="space-y-4 mt-6">
              <h4 className="font-medium">Describe your pain</h4>
              {painAreas.map((painArea, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{painArea.area}</h5>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePainArea(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Pain Level</Label>
                          <span className="text-sm font-medium">{painArea.painLevel}/10</span>
                        </div>
                        <Slider
                          value={[painArea.painLevel]}
                          onValueChange={(value) => updatePainArea(index, "painLevel", value[0])}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={painArea.description || ""}
                          onChange={(e) => updatePainArea(index, "description", e.target.value)}
                          placeholder="Describe the pain (sharp, dull, aching, etc.)"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Pain Level */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Pain Level</CardTitle>
          <CardDescription>On average, how would you rate your overall pain level?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Pain Level</Label>
              <span className="text-lg font-medium">{overallPainLevel}/10</span>
            </div>
            <Slider
              value={[overallPainLevel]}
              onValueChange={(value) => setValue("overallPainLevel", value[0])}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>No pain</span>
              <span>Severe pain</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Current Medications</CardTitle>
          <CardDescription>
            List all medications you are currently taking (prescription and over-the-counter)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentMedications.map((medication, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <span>{medication}</span>
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
                  addMedication(newMedication);
                  setNewMedication("");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                addMedication(newMedication);
                setNewMedication("");
              }}
              disabled={!newMedication.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle>Allergies</CardTitle>
          <CardDescription>
            List any allergies (medications, foods, environmental, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allergies.map((allergy, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <span>{allergy}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeAllergy(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Enter allergy"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAllergy(newAllergy);
                  setNewAllergy("");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                addAllergy(newAllergy);
                setNewAllergy("");
              }}
              disabled={!newAllergy.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle>Lifestyle</CardTitle>
          <CardDescription>
            Help us understand your daily activities and stress levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              {...register("occupation")}
              placeholder="Your occupation or daily activities"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exerciseFrequency">Exercise Frequency</Label>
            <Input
              id="exerciseFrequency"
              {...register("exerciseFrequency")}
              placeholder="e.g., 3 times per week, daily, rarely"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Stress Level</Label>
                <span className="text-sm font-medium">{watch("stressLevel")}/10</span>
              </div>
              <Slider
                value={[watch("stressLevel")]}
                onValueChange={(value) => setValue("stressLevel", value[0])}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Sleep Quality</Label>
                <span className="text-sm font-medium">{watch("sleepQuality")}/10</span>
              </div>
              <Slider
                value={[watch("sleepQuality")]}
                onValueChange={(value) => setValue("sleepQuality", value[0])}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
