"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface AnalyticsData {
  totalConsultations: number;
  completedConsultations: number;
  cancelledConsultations: number;
  noShowConsultations: number;
  averageDuration: number;
  conversionRate: number;
  revenue: number;
  topConcerns: { concern: string; count: number }[];
  consultationsByType: { type: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export function ConsultationAnalytics() {
  const [timeframe, setTimeframe] = useState("7");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConsultations: 0,
    completedConsultations: 0,
    cancelledConsultations: 0,
    noShowConsultations: 0,
    averageDuration: 0,
    conversionRate: 0,
    revenue: 0,
    topConcerns: [],
    consultationsByType: [],
    dailyTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = parseInt(timeframe);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Fetch consultations within timeframe
      const { data: consultations, error } = await supabase
        .from("consultations")
        .select(
          `
          *,
          appointment:appointments!consultations_appointment_id_fkey(
            id,
            start_time,
            end_time,
            service:services(price)
          )
        `
        )
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const completed = consultations?.filter((c) => c.consultation_status === "completed") || [];
      const cancelled = consultations?.filter((c) => c.consultation_status === "cancelled") || [];
      const noShows = consultations?.filter((c) => c.consultation_status === "no_show") || [];

      // Calculate average duration
      let totalDuration = 0;
      let durationCount = 0;
      completed.forEach((c) => {
        if (c.started_at && c.completed_at) {
          const duration = new Date(c.completed_at).getTime() - new Date(c.started_at).getTime();
          totalDuration += duration;
          durationCount++;
        }
      });
      const avgDuration = durationCount > 0 ? totalDuration / durationCount / 60000 : 0;

      // Calculate revenue from completed consultations
      const revenue = completed.reduce((sum, c) => {
        return sum + (c.appointment?.service?.price || 0);
      }, 0);

      // Count consultations by type
      const typeCount: Record<string, number> = {};
      consultations?.forEach((c) => {
        typeCount[c.consultation_type] = (typeCount[c.consultation_type] || 0) + 1;
      });
      const consultationsByType = Object.entries(typeCount).map(([type, count]) => ({
        type: type.replace("_", " "),
        count,
      }));

      // Extract top concerns from client goals
      const concernsMap: Record<string, number> = {};
      consultations?.forEach((c) => {
        if (c.client_goals) {
          // Simple keyword extraction - in production, you'd want more sophisticated NLP
          const keywords = [
            "weight loss",
            "muscle gain",
            "nutrition",
            "stress",
            "energy",
            "sleep",
            "pain",
            "flexibility",
          ];
          keywords.forEach((keyword) => {
            if (c.client_goals.toLowerCase().includes(keyword)) {
              concernsMap[keyword] = (concernsMap[keyword] || 0) + 1;
            }
          });
        }
      });
      const topConcerns = Object.entries(concernsMap)
        .map(([concern, count]) => ({ concern, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate daily trend
      const dailyCount: Record<string, number> = {};
      consultations?.forEach((c) => {
        const date = format(new Date(c.created_at), "MMM d");
        dailyCount[date] = (dailyCount[date] || 0) + 1;
      });
      const dailyTrend = Object.entries(dailyCount)
        .map(([date, count]) => ({ date, count }))
        .slice(-7); // Last 7 days

      // Calculate conversion rate (consultations that led to follow-up appointments)
      // For demo purposes, using a mock rate
      const conversionRate = completed.length > 0 ? 65 : 0; // 65% mock conversion rate

      setAnalytics({
        totalConsultations: consultations?.length || 0,
        completedConsultations: completed.length,
        cancelledConsultations: cancelled.length,
        noShowConsultations: noShows.length,
        averageDuration: avgDuration,
        conversionRate,
        revenue,
        topConcerns,
        consultationsByType,
        dailyTrend,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    analytics.totalConsultations > 0
      ? (analytics.completedConsultations / analytics.totalConsultations) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Consultation Analytics</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConsultations}</div>
            <Progress value={100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageDuration.toFixed(0)} min</div>
            <p className="text-xs text-muted-foreground mt-1">Per consultation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">From consultations</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultation Types */}
        <Card>
          <CardHeader>
            <CardTitle>Consultation Types</CardTitle>
            <CardDescription>Distribution by consultation method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.consultationsByType.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{item.type}</span>
                    <span className="text-sm text-muted-foreground">({item.count})</span>
                  </div>
                  <Progress
                    value={(item.count / analytics.totalConsultations) * 100}
                    className="w-[100px]"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Client Concerns */}
        <Card>
          <CardHeader>
            <CardTitle>Top Client Concerns</CardTitle>
            <CardDescription>Most common topics from consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topConcerns.length > 0 ? (
                analytics.topConcerns.map((item, index) => (
                  <div key={item.concern} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="capitalize">{item.concern}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count} mentions</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No concern data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
            <CardDescription>Consultation outcomes and follow-ups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Consultation to Booking</span>
                  <span className="text-sm font-medium">{analytics.conversionRate}%</span>
                </div>
                <Progress value={analytics.conversionRate} />
              </div>
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Completed
                  </span>
                  <span>{analytics.completedConsultations}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Cancelled
                  </span>
                  <span>{analytics.cancelledConsultations}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    No Show
                  </span>
                  <span>{analytics.noShowConsultations}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Trend</CardTitle>
            <CardDescription>Consultations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.dailyTrend.map((item) => (
                <div key={item.date} className="flex items-center justify-between">
                  <span className="text-sm">{item.date}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(item.count / 10) * 100} className="w-[100px]" />
                    <span className="text-sm font-medium w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
