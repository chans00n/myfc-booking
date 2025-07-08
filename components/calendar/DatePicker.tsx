"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isAfter, isBefore, isSameDay } from "date-fns";
import { getBusinessHours, getAppointmentSettings } from "@/lib/availability";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import "./calendar-custom.css";
import type { BusinessHours, AppointmentSettings } from "@/types";

interface DatePickerProps {
  onSelectDate: (date: Date) => void;
  selectedDate?: Date;
}

export function DatePicker({ onSelectDate, selectedDate }: DatePickerProps) {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [hours, appointmentSettings] = await Promise.all([
      getBusinessHours(),
      getAppointmentSettings(),
    ]);

    setBusinessHours(hours);
    setSettings(appointmentSettings);

    // Calculate disabled dates based on business hours
    const disabled: Date[] = [];
    const today = new Date();
    const maxDate = appointmentSettings
      ? addDays(today, appointmentSettings.advance_booking_days)
      : addDays(today, 30);

    // Disable days that have no business hours
    const activeDays = hours.filter((h) => h.is_active).map((h) => h.day_of_week);

    let currentDate = today;
    while (isBefore(currentDate, maxDate)) {
      const dayOfWeek = currentDate.getDay();
      if (!activeDays.includes(dayOfWeek)) {
        disabled.push(new Date(currentDate));
      }
      currentDate = addDays(currentDate, 1);
    }

    setDisabledDates(disabled);
  };

  const minDate = settings
    ? addDays(new Date(), Math.ceil(settings.minimum_notice_hours / 24))
    : new Date();

  const maxDate = settings
    ? addDays(new Date(), settings.advance_booking_days)
    : addDays(new Date(), 30);

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, minDate) || isAfter(date, maxDate)) {
      return true;
    }

    return disabledDates.some((d) => isSameDay(d, date));
  };

  return (
    <Card className="w-full">
      <div className="p-3 sm:p-4 w-full [&_.rdp-nav]:px-2 [&_.rdp-month_caption]:px-14 [&_.rdp-button]:opacity-100">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          disabled={isDateDisabled}
          className="w-full rounded-md [&_table]:w-full"
          initialFocus
        />
      </div>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4 text-xs text-muted-foreground space-y-1">
        <p className="flex items-start">
          <span className="mr-1">•</span>
          <span>Minimum {settings?.minimum_notice_hours || 24} hours advance notice required</span>
        </p>
        <p className="flex items-start">
          <span className="mr-1">•</span>
          <span>Can book up to {settings?.advance_booking_days || 30} days in advance</span>
        </p>
      </div>
    </Card>
  );
}
