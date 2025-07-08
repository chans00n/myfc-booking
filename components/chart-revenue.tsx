"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface RevenueData {
  date: string;
  revenue: number;
  appointments: number;
}

export function ChartRevenue() {
  const [timeRange, setTimeRange] = React.useState("30d");
  const [data, setData] = React.useState<RevenueData[]>([]);
  const [loading, setLoading] = React.useState(true);

  const supabase = createClient();

  React.useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      let startDate: Date;

      switch (timeRange) {
        case "7d":
          startDate = subDays(endDate, 7);
          break;
        case "30d":
          startDate = subDays(endDate, 30);
          break;
        case "90d":
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      // Fetch payments grouped by date
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount_cents, created_at, appointment_id")
        .eq("status", "succeeded")
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endOfDay(endDate).toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group payments by date
      const revenueByDate = new Map<string, { revenue: number; appointments: Set<string> }>();

      // Initialize all dates with zero values
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, "yyyy-MM-dd");
        revenueByDate.set(dateStr, { revenue: 0, appointments: new Set() });
      }

      // Aggregate payment data
      payments?.forEach((payment) => {
        const dateStr = format(new Date(payment.created_at), "yyyy-MM-dd");
        const existing = revenueByDate.get(dateStr) || { revenue: 0, appointments: new Set() };
        existing.revenue += payment.amount_cents;
        if (payment.appointment_id) {
          existing.appointments.add(payment.appointment_id);
        }
        revenueByDate.set(dateStr, existing);
      });

      // Convert to array format
      const chartData: RevenueData[] = Array.from(revenueByDate.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue / 100, // Convert cents to dollars
        appointments: data.appointments.size,
      }));

      setData(chartData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);
  const totalAppointments = data.reduce((sum, day) => sum + day.appointments, 0);
  const avgRevenuePerDay = data.length > 0 ? totalRevenue / data.length : 0;

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Daily revenue from appointments</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]" aria-label="Select time range">
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 90 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  $
                  {totalRevenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{totalAppointments}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg per Day</p>
                <p className="text-2xl font-bold">
                  $
                  {avgRevenuePerDay.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, "MMM d");
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
                        formatter={(value, name) => {
                          if (name === "revenue") {
                            return [`$${Number(value).toFixed(2)}`, "Revenue"];
                          }
                          return [value, name];
                        }}
                      />
                    }
                  />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="url(#fillRevenue)"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
