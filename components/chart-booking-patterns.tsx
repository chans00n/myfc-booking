"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DayData {
  day: string;
  bookings: number;
  percentage: number;
}

interface TimeData {
  hour: string;
  bookings: number;
  percentage: number;
}

export function ChartBookingPatterns() {
  const [dayData, setDayData] = React.useState<DayData[]>([]);
  const [timeData, setTimeData] = React.useState<TimeData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [peakDay, setPeakDay] = React.useState("");
  const [peakTime, setPeakTime] = React.useState("");

  const supabase = createClient();

  React.useEffect(() => {
    fetchBookingPatterns();
  }, []);

  const fetchBookingPatterns = async () => {
    setLoading(true);
    try {
      // Fetch all appointments from the last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("appointment_date, start_time")
        .gte("appointment_date", ninetyDaysAgo.toISOString().split("T")[0])
        .in("status", ["completed", "confirmed", "scheduled"]);

      if (error) throw error;

      // Process day of week patterns
      const dayMap = new Map<number, number>();
      const timeMap = new Map<number, number>();

      appointments?.forEach((apt) => {
        // Day of week analysis
        const date = new Date(apt.appointment_date);
        const dayOfWeek = date.getDay();
        dayMap.set(dayOfWeek, (dayMap.get(dayOfWeek) || 0) + 1);

        // Hour of day analysis
        const [hour] = apt.start_time.split(":").map(Number);
        timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
      });

      // Convert day data
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const totalBookings = appointments?.length || 0;

      const processedDayData: DayData[] = [];
      let maxDayBookings = 0;
      let peakDayName = "";

      for (let i = 0; i < 7; i++) {
        const bookings = dayMap.get(i) || 0;
        const percentage = totalBookings > 0 ? (bookings / totalBookings) * 100 : 0;

        if (bookings > maxDayBookings) {
          maxDayBookings = bookings;
          peakDayName = dayNames[i];
        }

        processedDayData.push({
          day: dayNames[i],
          bookings,
          percentage,
        });
      }

      setPeakDay(peakDayName);
      setDayData(processedDayData);

      // Convert time data
      const processedTimeData: TimeData[] = [];
      let maxTimeBookings = 0;
      let peakHour = 0;

      for (let hour = 8; hour <= 19; hour++) {
        // 8 AM to 7 PM
        const bookings = timeMap.get(hour) || 0;
        const percentage = totalBookings > 0 ? (bookings / totalBookings) * 100 : 0;

        if (bookings > maxTimeBookings) {
          maxTimeBookings = bookings;
          peakHour = hour;
        }

        const hourLabel = hour === 12 ? "12 PM" : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;

        processedTimeData.push({
          hour: hourLabel,
          bookings,
          percentage,
        });
      }

      const peakTimeLabel =
        peakHour === 12 ? "12 PM" : peakHour < 12 ? `${peakHour} AM` : `${peakHour - 12} PM`;
      setPeakTime(peakTimeLabel);
      setTimeData(processedTimeData);
    } catch (error) {
      console.error("Error fetching booking patterns:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    bookings: {
      label: "Bookings",
      color: "hsl(var(--chart-1))",
    },
  };

  const getBarColor = (percentage: number, maxPercentage: number) => {
    const intensity = percentage / maxPercentage;
    if (intensity > 0.8) return "hsl(var(--chart-1))";
    if (intensity > 0.5) return "hsl(var(--chart-2))";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Patterns</CardTitle>
        <CardDescription>Popular booking days and times based on last 90 days</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="days" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="days">By Day of Week</TabsTrigger>
              <TabsTrigger value="times">By Time of Day</TabsTrigger>
            </TabsList>

            <TabsContent value="days" className="mt-4">
              <div className="space-y-4">
                {peakDay && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Most popular day</p>
                    <p className="text-lg font-semibold">{peakDay}</p>
                  </div>
                )}
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              return [`${value} bookings`, "Total"];
                            }}
                          />
                        }
                      />
                      <Bar dataKey="bookings" radius={[8, 8, 0, 0]}>
                        {dayData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(
                              entry.percentage,
                              Math.max(...dayData.map((d) => d.percentage))
                            )}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </TabsContent>

            <TabsContent value="times" className="mt-4">
              <div className="space-y-4">
                {peakTime && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Most popular time</p>
                    <p className="text-lg font-semibold">{peakTime}</p>
                  </div>
                )}
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              return [`${value} bookings`, "Total"];
                            }}
                          />
                        }
                      />
                      <Bar dataKey="bookings" radius={[8, 8, 0, 0]}>
                        {timeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(
                              entry.percentage,
                              Math.max(...timeData.map((t) => t.percentage))
                            )}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
