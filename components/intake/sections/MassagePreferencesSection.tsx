"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import type { IntakeFormData } from "@/types/intake-forms";

interface MassagePreferencesSectionProps {
  form: UseFormReturn<IntakeFormData>;
}

const MASSAGE_TECHNIQUES = [
  "Swedish Massage",
  "Deep Tissue",
  "Trigger Point Therapy",
  "Myofascial Release",
  "Sports Massage",
  "Prenatal Massage",
  "Hot Stone",
  "Aromatherapy",
  "Reflexology",
  "Lymphatic Drainage",
];

const BODY_AREAS_TO_AVOID = [
  "Face",
  "Scalp",
  "Neck",
  "Chest",
  "Abdomen",
  "Lower Back",
  "Glutes",
  "Inner Thighs",
  "Feet",
];

export function MassagePreferencesSection({ form }: MassagePreferencesSectionProps) {
  const { watch, setValue, register } = form;
  const previousExperience = watch("previousMassageExperience");
  const pressurePreference = watch("pressurePreference");
  const areasToAvoid = watch("areasToAvoid");
  const preferredTechniques = watch("preferredTechniques");

  const [customAreaToAvoid, setCustomAreaToAvoid] = useState("");

  const toggleAreaToAvoid = (area: string) => {
    if (areasToAvoid.includes(area)) {
      setValue(
        "areasToAvoid",
        areasToAvoid.filter((a) => a !== area)
      );
    } else {
      setValue("areasToAvoid", [...areasToAvoid, area]);
    }
  };

  const addCustomAreaToAvoid = () => {
    if (customAreaToAvoid.trim() && !areasToAvoid.includes(customAreaToAvoid.trim())) {
      setValue("areasToAvoid", [...areasToAvoid, customAreaToAvoid.trim()]);
      setCustomAreaToAvoid("");
    }
  };

  const togglePreferredTechnique = (technique: string) => {
    if (preferredTechniques.includes(technique)) {
      setValue(
        "preferredTechniques",
        preferredTechniques.filter((t) => t !== technique)
      );
    } else {
      setValue("preferredTechniques", [...preferredTechniques, technique]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Previous Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Massage Experience</CardTitle>
          <CardDescription>Tell us about your previous massage experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Have you received professional massage before?</Label>
            <RadioGroup
              value={previousExperience ? "yes" : "no"}
              onValueChange={(value) => setValue("previousMassageExperience", value === "yes")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="exp-yes" />
                <Label htmlFor="exp-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="exp-no" />
                <Label htmlFor="exp-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {previousExperience && (
            <>
              <div className="space-y-2">
                <Label htmlFor="lastMassageDate">When was your last massage?</Label>
                <Input id="lastMassageDate" type="date" {...register("lastMassageDate")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="massageFrequency">How often do you receive massage?</Label>
                <Input
                  id="massageFrequency"
                  {...register("massageFrequency")}
                  placeholder="e.g., Monthly, Every few months, Rarely"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pressure Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Pressure Preference</CardTitle>
          <CardDescription>What level of pressure do you prefer during massage?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={pressurePreference}
            onValueChange={(value: any) => setValue("pressurePreference", value)}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="pressure-light" />
                <Label htmlFor="pressure-light">Light - Gentle, relaxing touch</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="pressure-medium" />
                <Label htmlFor="pressure-medium">
                  Medium - Moderate pressure, good for general relaxation
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="firm" id="pressure-firm" />
                <Label htmlFor="pressure-firm">
                  Firm - Stronger pressure to work on muscle tension
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deep" id="pressure-deep" />
                <Label htmlFor="pressure-deep">
                  Deep - Very strong pressure for deep tissue work
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="varies" id="pressure-varies" />
                <Label htmlFor="pressure-varies">
                  Varies - Different pressure for different areas
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Areas to Avoid */}
      <Card>
        <CardHeader>
          <CardTitle>Areas to Avoid</CardTitle>
          <CardDescription>
            Please select any areas you would prefer not to be massaged
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BODY_AREAS_TO_AVOID.map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={`avoid-${area}`}
                  checked={areasToAvoid.includes(area)}
                  onCheckedChange={() => toggleAreaToAvoid(area)}
                />
                <Label htmlFor={`avoid-${area}`} className="text-sm font-normal cursor-pointer">
                  {area}
                </Label>
              </div>
            ))}
          </div>

          {/* Custom areas */}
          {areasToAvoid.filter((area) => !BODY_AREAS_TO_AVOID.includes(area)).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Other areas:</Label>
              <div className="flex flex-wrap gap-2">
                {areasToAvoid
                  .filter((area) => !BODY_AREAS_TO_AVOID.includes(area))
                  .map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md"
                    >
                      <span className="text-sm">{area}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() =>
                          setValue(
                            "areasToAvoid",
                            areasToAvoid.filter((a) => a !== area)
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={customAreaToAvoid}
              onChange={(e) => setCustomAreaToAvoid(e.target.value)}
              placeholder="Add other area to avoid"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAreaToAvoid();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomAreaToAvoid}
              disabled={!customAreaToAvoid.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferred Techniques */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Techniques</CardTitle>
          <CardDescription>
            Select any massage techniques you particularly enjoy or would like to try
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MASSAGE_TECHNIQUES.map((technique) => (
              <div key={technique} className="flex items-center space-x-2">
                <Checkbox
                  id={`tech-${technique}`}
                  checked={preferredTechniques.includes(technique)}
                  onCheckedChange={() => togglePreferredTechnique(technique)}
                />
                <Label htmlFor={`tech-${technique}`} className="text-sm font-normal cursor-pointer">
                  {technique}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
