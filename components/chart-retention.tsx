"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { subMonths, format } from "date-fns";

interface RetentionData {
  month: string;
  returningClients: number;
  newClients: number;
  retentionRate: number;
}

export function ChartRetention() {
  const [data, setData] = React.useState<RetentionData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [overallRetention, setOverallRetention] = React.useState(0);

  const supabase = createClient();

  React.useEffect(() => {
    fetchRetentionData();
  }, []);

  const fetchRetentionData = async () => {
    setLoading(true);
    try {
      const monthsData: RetentionData[] = [];
      const now = new Date();

      // Calculate retention for the last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        // Get all appointments for this month
        const { data: monthAppointments } = await supabase
          .from("appointments")
          .select("client_id")
          .gte("appointment_date", format(monthStart, "yyyy-MM-dd"))
          .lte("appointment_date", format(monthEnd, "yyyy-MM-dd"))
          .in("status", ["completed", "confirmed", "scheduled"]);

        const uniqueClients = new Set(monthAppointments?.map((a) => a.client_id) || []);

        // Get clients who had appointments in previous months
        const prevMonthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth(), 0);
        const { data: previousAppointments } = await supabase
          .from("appointments")
          .select("client_id")
          .lte("appointment_date", format(prevMonthEnd, "yyyy-MM-dd"))
          .in("status", ["completed"]);

        const previousClients = new Set(previousAppointments?.map((a) => a.client_id) || []);

        // Calculate returning vs new clients
        let returningCount = 0;
        let newCount = 0;

        uniqueClients.forEach((clientId) => {
          if (previousClients.has(clientId)) {
            returningCount++;
          } else {
            newCount++;
          }
        });

        const totalClients = returningCount + newCount;
        const retentionRate = totalClients > 0 ? (returningCount / totalClients) * 100 : 0;

        monthsData.push({
          month: format(monthDate, "MMM"),
          returningClients: returningCount,
          newClients: newCount,
          retentionRate,
        });
      }

      setData(monthsData);

      // Calculate overall retention rate (average of last 3 months)
      const lastThreeMonths = monthsData.slice(-3);
      const avgRetention = lastThreeMonths.reduce((sum, m) => sum + m.retentionRate, 0) / 3;
      setOverallRetention(avgRetention);
    } catch (error) {
      console.error("Error fetching retention data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    retentionRate: {
      label: "Retention Rate",
      color: "hsl(var(--chart-1))",
    },
    returningClients: {
      label: "Returning Clients",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Retention</CardTitle>
            <CardDescription>Tracking client return rates over time</CardDescription>
          </div>
          {!loading && (
            <div className="text-right">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {overallRetention.toFixed(1)}%
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">3-month avg</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No retention data available
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
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
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          if (name === "retentionRate") {
                            return [`${value}%`, "Retention Rate"];
                          }
                          return [value, name];
                        }}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="retentionRate"
                    stroke="var(--color-retentionRate)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Client breakdown */}
            <div className="mt-4 grid grid-cols-6 gap-2 text-center">
              {data.map((month, index) => (
                <div key={month.month} className="space-y-1">
                  <p className="text-xs font-medium">{month.month}</p>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600 font-medium">{month.returningClients}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-blue-600 font-medium">+{month.newClients}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-600" />
                <span>Returning</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span>New</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
