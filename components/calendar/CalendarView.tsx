"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import { getAppointments, getTimeBlocks } from "@/lib/availability";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-custom.css";
import "./calendar-dark-mode.css";
import "./calendar-dark-override.css";
import type { Appointment, TimeBlock } from "@/types";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "appointment" | "timeblock";
    data: Appointment | TimeBlock;
  };
}

interface CalendarViewProps {
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

export function CalendarView({ onSelectEvent, onSelectSlot }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);

    // Calculate date range based on current view
    const start = moment(date)
      .startOf(view === "day" ? "day" : "week")
      .toDate();
    const end = moment(date)
      .endOf(view === "day" ? "day" : view === "week" ? "week" : "month")
      .toDate();

    const [appointments, timeBlocks] = await Promise.all([
      getAppointments(start, end),
      getTimeBlocks(start, end),
    ]);

    // Convert to calendar events
    const calendarEvents: CalendarEvent[] = [];

    // Add appointments
    appointments.forEach((apt) => {
      const aptDate = new Date(apt.appointment_date);
      const [startHour, startMin] = apt.start_time.split(":").map(Number);
      const [endHour, endMin] = apt.end_time.split(":").map(Number);

      const start = new Date(aptDate);
      start.setHours(startHour, startMin, 0);

      const end = new Date(aptDate);
      end.setHours(endHour, endMin, 0);

      calendarEvents.push({
        id: apt.id,
        title: `${apt.service?.name || "Appointment"}`,
        start,
        end,
        resource: {
          type: "appointment",
          data: apt,
        },
      });
    });

    // Add time blocks
    timeBlocks.forEach((block) => {
      calendarEvents.push({
        id: block.id,
        title: block.title,
        start: new Date(block.start_datetime),
        end: new Date(block.end_datetime),
        resource: {
          type: "timeblock",
          data: block,
        },
      });
    });

    setEvents(calendarEvents);
    setLoading(false);
  }, [date, view]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "hsl(var(--primary))";
    let borderColor = "hsl(var(--primary))";

    if (event.resource.type === "appointment") {
      const apt = event.resource.data as Appointment;
      if (apt.status === "confirmed") {
        backgroundColor = "hsl(142 76% 36%)"; // green-600
        borderColor = "hsl(142 76% 36%)";
      } else if (apt.status === "cancelled") {
        backgroundColor = "hsl(0 84% 60%)"; // red-500
        borderColor = "hsl(0 84% 60%)";
      }
    } else if (event.resource.type === "timeblock") {
      backgroundColor = "hsl(var(--muted-foreground))";
      borderColor = "hsl(var(--muted-foreground))";
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: "1px",
        borderRadius: "6px",
        fontSize: "0.75rem",
        padding: "2px 4px",
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const apt = event.resource.type === "appointment" ? (event.resource.data as Appointment) : null;

    return (
      <div className="flex flex-col h-full p-1">
        <div className="font-medium text-xs truncate">{event.title}</div>
        {apt && (
          <div className="text-[10px] opacity-90 truncate">
            {apt.client?.first_name} {apt.client?.last_name}
          </div>
        )}
      </div>
    );
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => toolbar.onNavigate("PREV");
    const goToNext = () => toolbar.onNavigate("NEXT");
    const goToToday = () => toolbar.onNavigate("TODAY");

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{toolbar.label}</h2>
        </div>

        <div className="flex gap-1">
          {toolbar.views.map((name: string) => (
            <Button
              key={name}
              variant={toolbar.view === name ? "default" : "outline"}
              size="sm"
              onClick={() => toolbar.onView(name)}
              className="capitalize"
            >
              {name}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Calendar</h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs gap-1">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            Confirmed
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Scheduled
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            Blocked
          </Badge>
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading calendar...</p>
            </div>
          </div>
        )}

        <div className={cn("h-[600px] p-4", loading && "opacity-50")}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            onSelectEvent={onSelectEvent}
            onSelectSlot={onSelectSlot}
            selectable={true}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
              toolbar: CustomToolbar,
            }}
            views={["month", "week", "day"]}
            defaultView="month"
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 20, 0, 0)}
            dayLayoutAlgorithm="no-overlap"
            popup
            popupOffset={30}
          />
        </div>
      </div>
    </Card>
  );
}
