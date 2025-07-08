"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface AppointmentCount {
  date: string;
  count: number;
  hasConfirmed: boolean;
}

interface DashboardCalendarProps {
  onDateSelect?: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
}

export function DashboardCalendar({ onDateSelect, selectedDate }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [appointmentDates, setAppointmentDates] = React.useState<Map<string, AppointmentCount>>(
    new Map()
  );
  const [loading, setLoading] = React.useState(true);

  const supabase = createClient();

  React.useEffect(() => {
    fetchMonthAppointments(currentMonth);
  }, [currentMonth]);

  const fetchMonthAppointments = async (month: Date) => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("appointment_date, status")
        .gte("appointment_date", format(monthStart, "yyyy-MM-dd"))
        .lte("appointment_date", format(monthEnd, "yyyy-MM-dd"))
        .in("status", ["scheduled", "confirmed"]);

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      const counts = new Map<string, AppointmentCount>();

      appointments?.forEach((apt) => {
        const dateStr = apt.appointment_date;
        const existing = counts.get(dateStr) || { date: dateStr, count: 0, hasConfirmed: false };
        existing.count++;
        if (apt.status === "confirmed") {
          existing.hasConfirmed = true;
        }
        counts.set(dateStr, existing);
      });

      setAppointmentDates(counts);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create dates array for modifiers
  const appointmentDatesList = React.useMemo(() => {
    const dates: Date[] = [];
    appointmentDates.forEach((_, dateStr) => {
      // Parse the date string properly
      const [year, month, day] = dateStr.split("-").map(Number);
      dates.push(new Date(year, month - 1, day));
    });
    return dates;
  }, [appointmentDates]);

  const hasConfirmedDatesList = React.useMemo(() => {
    const dates: Date[] = [];
    appointmentDates.forEach((count, dateStr) => {
      if (count.hasConfirmed) {
        const [year, month, day] = dateStr.split("-").map(Number);
        dates.push(new Date(year, month - 1, day));
      }
    });
    return dates;
  }, [appointmentDates]);

  const handleDateSelect = (date: Date | undefined) => {
    // Only trigger onDateSelect if the date has appointments
    if (date && appointmentDates.has(format(date, "yyyy-MM-dd"))) {
      onDateSelect?.(date);
    } else {
      onDateSelect?.(undefined);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 px-3">
        {loading ? (
          <div className="flex items-center justify-center h-[280px] px-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={{
                hasAppointments: appointmentDatesList,
                hasConfirmed: hasConfirmedDatesList,
              }}
              modifiersClassNames={{
                hasAppointments:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full cursor-pointer",
                hasConfirmed: "after:!bg-green-600",
              }}
              disabled={() => {
                // Optionally disable dates without appointments
                return false; // Keep all dates clickable for now
              }}
              className="rounded-md border-0 w-full p-3"
              classNames={{
                months: "relative w-full",
                month: "space-y-3 w-full",
                nav: "flex items-center justify-between absolute top-0 left-0 right-0 z-10",
                button_previous: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                button_next: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                month_caption: "flex justify-center items-center h-7",
                caption_label: "text-sm font-medium",
                table: "w-full border-collapse mt-8",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground font-normal text-[0.8rem] text-center flex-1",
                row: "flex w-full mt-2",
                cell: "relative text-center text-sm flex-1 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-10 w-10 mx-auto p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md inline-flex items-center justify-center",
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
            <div className="mt-3 pt-3 pb-3 px-3 border-t space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Scheduled appointments</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span className="text-muted-foreground">Has confirmed appointments</span>
              </div>
              {selectedDate && appointmentDates.has(format(selectedDate, "yyyy-MM-dd")) && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  <Badge variant="secondary" className="text-xs">
                    {appointmentDates.get(format(selectedDate, "yyyy-MM-dd"))?.count || 0}{" "}
                    appointments on {format(selectedDate, "MMM d")}
                  </Badge>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
