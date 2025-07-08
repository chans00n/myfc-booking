import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));

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

    if (error) {
      console.error("Error fetching consultations:", error);
      return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
    }

    // Calculate metrics
    const total = consultations?.length || 0;
    const completed = consultations?.filter((c) => c.consultation_status === "completed") || [];
    const cancelled = consultations?.filter((c) => c.consultation_status === "cancelled") || [];
    const noShows = consultations?.filter((c) => c.consultation_status === "no_show") || [];
    const scheduled = consultations?.filter((c) => c.consultation_status === "scheduled") || [];
    const inProgress = consultations?.filter((c) => c.consultation_status === "in_progress") || [];

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
    const averageDuration = durationCount > 0 ? totalDuration / durationCount / 60000 : 0;

    // Calculate revenue
    const revenue = completed.reduce((sum, c) => {
      return sum + (c.appointment?.service?.price || 0);
    }, 0);

    // Count by type
    const typeCount: Record<string, number> = {};
    consultations?.forEach((c) => {
      typeCount[c.consultation_type] = (typeCount[c.consultation_type] || 0) + 1;
    });

    // Daily breakdown
    const dailyBreakdown: Record<string, any> = {};
    consultations?.forEach((c) => {
      const date = format(new Date(c.created_at), "yyyy-MM-dd");
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          total: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
        };
      }
      dailyBreakdown[date].total++;
      if (c.consultation_status === "completed") {
        dailyBreakdown[date].completed++;
        dailyBreakdown[date].revenue += c.appointment?.service?.price || 0;
      }
      if (c.consultation_status === "cancelled") {
        dailyBreakdown[date].cancelled++;
      }
    });

    // Convert daily breakdown to array
    const dailyStats = Object.entries(dailyBreakdown)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate conversion rate (mock for now)
    const conversionRate = completed.length > 0 ? 65 : 0;

    const analytics = {
      summary: {
        total,
        completed: completed.length,
        cancelled: cancelled.length,
        noShow: noShows.length,
        scheduled: scheduled.length,
        inProgress: inProgress.length,
        completionRate: total > 0 ? (completed.length / total) * 100 : 0,
        cancellationRate: total > 0 ? (cancelled.length / total) * 100 : 0,
        noShowRate: total > 0 ? (noShows.length / total) * 100 : 0,
      },
      financial: {
        totalRevenue: revenue,
        averageConsultationValue: completed.length > 0 ? revenue / completed.length : 0,
        projectedRevenue: scheduled.length * (revenue / Math.max(completed.length, 1)),
      },
      operational: {
        averageDuration,
        totalDurationMinutes: totalDuration / 60000,
        consultationsPerDay: total / days,
      },
      types: Object.entries(typeCount).map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      })),
      dailyStats,
      conversionMetrics: {
        consultationToBookingRate: conversionRate,
        followUpRate: 45, // Mock data
        clientRetentionRate: 78, // Mock data
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
