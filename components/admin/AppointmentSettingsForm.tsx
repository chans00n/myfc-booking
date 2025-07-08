"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAppointmentSettings, updateAppointmentSettings } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { AppointmentSettings } from "@/types";

const settingsSchema = z.object({
  buffer_time_minutes: z.number().min(0).max(60),
  advance_booking_days: z.number().min(1).max(365),
  minimum_notice_hours: z.number().min(0).max(168),
  cancellation_cutoff_hours: z.number().min(0).max(168),
  timezone: z.string(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface AppointmentSettingsFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AppointmentSettingsForm({ onSuccess, onCancel }: AppointmentSettingsFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getAppointmentSettings();
    if (data) {
      setSettings(data);
      setValue("buffer_time_minutes", data.buffer_time_minutes);
      setValue("advance_booking_days", data.advance_booking_days);
      setValue("minimum_notice_hours", data.minimum_notice_hours);
      setValue("cancellation_cutoff_hours", data.cancellation_cutoff_hours);
      setValue("timezone", data.timezone);
    }
    setLoading(false);
  };

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);

    const result = await updateAppointmentSettings(data);

    if (result) {
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
      onSuccess();
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Booking Rules</h3>
        <p className="text-sm text-gray-500">Configure how clients can book appointments</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="minimum_notice_hours">Minimum Notice (hours)</Label>
          <Input
            id="minimum_notice_hours"
            type="number"
            {...register("minimum_notice_hours", { valueAsNumber: true })}
          />
          <p className="text-sm text-gray-500">
            How many hours in advance must appointments be booked
          </p>
          {errors.minimum_notice_hours && (
            <p className="text-sm text-red-500">{errors.minimum_notice_hours.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="advance_booking_days">Advance Booking Limit (days)</Label>
          <Input
            id="advance_booking_days"
            type="number"
            {...register("advance_booking_days", { valueAsNumber: true })}
          />
          <p className="text-sm text-gray-500">How far in advance can appointments be booked</p>
          {errors.advance_booking_days && (
            <p className="text-sm text-red-500">{errors.advance_booking_days.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cancellation_cutoff_hours">Cancellation Deadline (hours)</Label>
          <Input
            id="cancellation_cutoff_hours"
            type="number"
            {...register("cancellation_cutoff_hours", { valueAsNumber: true })}
          />
          <p className="text-sm text-gray-500">
            How many hours before appointment can it be cancelled
          </p>
          {errors.cancellation_cutoff_hours && (
            <p className="text-sm text-red-500">{errors.cancellation_cutoff_hours.message}</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Scheduling</h3>
        <p className="text-sm text-gray-500">Configure appointment scheduling preferences</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="buffer_time_minutes">Buffer Time Between Appointments (minutes)</Label>
          <Input
            id="buffer_time_minutes"
            type="number"
            {...register("buffer_time_minutes", { valueAsNumber: true })}
          />
          <p className="text-sm text-gray-500">
            Time to add between appointments for cleanup and preparation
          </p>
          {errors.buffer_time_minutes && (
            <p className="text-sm text-red-500">{errors.buffer_time_minutes.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" {...register("timezone")} placeholder="America/Los_Angeles" />
          <p className="text-sm text-gray-500">Your business timezone for appointment scheduling</p>
          {errors.timezone && <p className="text-sm text-red-500">{errors.timezone.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}
