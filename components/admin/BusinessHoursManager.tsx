"use client";

import { useState, useEffect } from "react";
import { getBusinessHours, updateBusinessHours } from "@/lib/availability";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { BusinessHours } from "@/types";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function BusinessHoursManager() {
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    setLoading(true);
    const data = await getBusinessHours();

    // Ensure we have all days of the week
    const allHours = DAYS_OF_WEEK.map((_, index) => {
      const existing = data.find((h) => h.day_of_week === index);
      return (
        existing || {
          id: "",
          day_of_week: index,
          start_time: "09:00:00",
          end_time: "17:00:00",
          is_active: false,
          created_at: "",
          updated_at: "",
        }
      );
    });

    setHours(allHours);
    setLoading(false);
  };

  const handleUpdate = async (dayOfWeek: number, field: string, value: any) => {
    const updatedHours = hours.map((h) =>
      h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
    );
    setHours(updatedHours);
  };

  const handleSave = async (dayOfWeek: number) => {
    setSaving(true);
    const dayHours = hours.find((h) => h.day_of_week === dayOfWeek);
    if (!dayHours) return;

    const result = await updateBusinessHours(
      dayOfWeek,
      dayHours.start_time,
      dayHours.end_time,
      dayHours.is_active
    );

    if (result) {
      toast({
        title: "Success",
        description: `Updated hours for ${DAYS_OF_WEEK[dayOfWeek]}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update business hours",
        variant: "destructive",
      });
    }

    setSaving(false);
  };

  const formatTimeForInput = (time: string) => {
    // Convert HH:mm:ss to HH:mm for input
    return time.substring(0, 5);
  };

  const formatTimeForSave = (time: string) => {
    // Convert HH:mm to HH:mm:ss
    return `${time}:00`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>Set your regular working hours for each day of the week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hours.map((dayHours) => (
            <div key={dayHours.day_of_week} className="space-y-3 py-4 border-b last:border-0">
              {/* Mobile layout */}
              <div className="flex flex-col space-y-3 sm:hidden">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">
                    {DAYS_OF_WEEK[dayHours.day_of_week]}
                  </Label>
                  <Switch
                    checked={dayHours.is_active}
                    onCheckedChange={(checked) =>
                      handleUpdate(dayHours.day_of_week, "is_active", checked)
                    }
                  />
                </div>

                {dayHours.is_active && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formatTimeForInput(dayHours.start_time)}
                      onChange={(e) =>
                        handleUpdate(
                          dayHours.day_of_week,
                          "start_time",
                          formatTimeForSave(e.target.value)
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={formatTimeForInput(dayHours.end_time)}
                      onChange={(e) =>
                        handleUpdate(
                          dayHours.day_of_week,
                          "end_time",
                          formatTimeForSave(e.target.value)
                        )
                      }
                      className="flex-1"
                    />
                  </div>
                )}

                {dayHours.is_active && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave(dayHours.day_of_week)}
                    disabled={saving}
                    className="w-full"
                  >
                    Save {DAYS_OF_WEEK[dayHours.day_of_week]}
                  </Button>
                )}
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center">
                <div className="col-span-2">
                  <Label className="font-medium">{DAYS_OF_WEEK[dayHours.day_of_week]}</Label>
                </div>

                <div className="col-span-2">
                  <Switch
                    checked={dayHours.is_active}
                    onCheckedChange={(checked) =>
                      handleUpdate(dayHours.day_of_week, "is_active", checked)
                    }
                  />
                </div>

                <div className="col-span-3">
                  <Input
                    type="time"
                    value={formatTimeForInput(dayHours.start_time)}
                    onChange={(e) =>
                      handleUpdate(
                        dayHours.day_of_week,
                        "start_time",
                        formatTimeForSave(e.target.value)
                      )
                    }
                    disabled={!dayHours.is_active}
                  />
                </div>

                <div className="col-span-1 text-center">to</div>

                <div className="col-span-3">
                  <Input
                    type="time"
                    value={formatTimeForInput(dayHours.end_time)}
                    onChange={(e) =>
                      handleUpdate(
                        dayHours.day_of_week,
                        "end_time",
                        formatTimeForSave(e.target.value)
                      )
                    }
                    disabled={!dayHours.is_active}
                  />
                </div>

                <div className="col-span-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave(dayHours.day_of_week)}
                    disabled={saving}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
