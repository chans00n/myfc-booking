"use client";

import { useState, useEffect } from "react";
import { AdminSiteHeader } from "@/components/admin-site-header";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  format,
  formatDistanceToNow,
  startOfDay,
  endOfDay,
  isToday,
  isTomorrow,
  addDays,
} from "date-fns";
import {
  Video,
  Phone,
  Users,
  Calendar,
  Clock,
  Search,
  ChevronRight,
  Play,
  X,
  RefreshCw,
  FileText,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CreateTestDataButton } from "@/components/admin/consultations/CreateTestDataButton";

interface Consultation {
  id: string;
  appointment_id: string;
  client_id: string;
  consultation_type: "phone" | "video" | "in_person";
  consultation_status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  consultation_notes: string | null;
  client_goals: string | null;
  health_overview: string | null;
  started_at: string | null;
  completed_at: string | null;
  daily_room_name: string | null;
  daily_room_url: string | null;
  created_at: string;
  updated_at: string;
  appointment: {
    id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    service: {
      name: string;
      duration_minutes: number;
    };
  } | null;
  client: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

interface ConsultationStats {
  todayTotal: number;
  todayCompleted: number;
  upcomingWeek: number;
  completionRate: number;
  averageDuration: number;
  noShowRate: number;
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [stats, setStats] = useState<ConsultationStats>({
    todayTotal: 0,
    todayCompleted: 0,
    upcomingWeek: 0,
    completionRate: 0,
    averageDuration: 0,
    noShowRate: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);

      // Fetch consultations with related data
      const { data: consultationsData, error: consultationsError } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false });

      if (consultationsError) {
        console.error("Error fetching consultations:", consultationsError);
        throw consultationsError;
      }

      // Fetch appointments for these consultations
      const appointmentIds = consultationsData?.map((c) => c.appointment_id).filter(Boolean) || [];

      let appointmentsData = [];
      if (appointmentIds.length > 0) {
        const { data, error: appointmentsError } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_date,
            start_time,
            end_time,
            status,
            services (name, duration_minutes)
          `
          )
          .in("id", appointmentIds);

        if (!appointmentsError) {
          appointmentsData = data || [];
        }
      }

      // Fetch client profiles
      const clientIds = consultationsData?.map((c) => c.client_id).filter(Boolean) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", clientIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Map the data together
      const mappedData =
        consultationsData?.map((consultation) => {
          const appointment = appointmentsData?.find((a) => a.id === consultation.appointment_id);
          const client = profilesData?.find((p) => p.id === consultation.client_id);

          // Log if we have consultations without appointments
          if (!appointment && consultation.appointment_id) {
            console.warn(
              `Consultation ${consultation.id} references appointment ${consultation.appointment_id} which was not found`
            );
          }

          return {
            ...consultation,
            appointment: appointment
              ? {
                  id: appointment.id,
                  appointment_date: appointment.appointment_date,
                  start_time: appointment.start_time,
                  end_time: appointment.end_time,
                  status: appointment.status,
                  service: appointment.services,
                }
              : null,
            client: client || null,
          };
        }) || [];

      console.log("Fetched consultations:", mappedData.length);
      console.log("Sample consultation:", mappedData[0]);
      setConsultations(mappedData);
      calculateStats(mappedData);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      toast.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (consultationData: Consultation[]) => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const weekEnd = addDays(today, 7);

    // Match dashboard logic - filter by created_at for "today's consultations"
    const todayConsultations = consultationData.filter((c) => {
      const createdAt = new Date(c.created_at);
      return createdAt >= todayStart && createdAt <= todayEnd;
    });

    const completedToday = todayConsultations.filter(
      (c) => c.consultation_status === "completed"
    ).length;

    const upcomingWeek = consultationData.filter((c) => {
      if (!c.appointment || !c.appointment.appointment_date) return false;
      const appointmentDateTime = new Date(
        `${c.appointment.appointment_date}T${c.appointment.start_time}`
      );
      return (
        appointmentDateTime > today &&
        appointmentDateTime <= weekEnd &&
        c.consultation_status === "scheduled"
      );
    }).length;

    const allCompleted = consultationData.filter((c) => c.consultation_status === "completed");
    const completionRate =
      consultationData.length > 0 ? (allCompleted.length / consultationData.length) * 100 : 0;

    // Calculate average duration for completed consultations
    let totalDuration = 0;
    let durationCount = 0;
    allCompleted.forEach((c) => {
      if (c.started_at && c.completed_at) {
        const duration = new Date(c.completed_at).getTime() - new Date(c.started_at).getTime();
        totalDuration += duration;
        durationCount++;
      }
    });
    const averageDuration = durationCount > 0 ? totalDuration / durationCount / 60000 : 0; // Convert to minutes

    const noShows = consultationData.filter((c) => c.consultation_status === "no_show").length;
    const noShowRate = consultationData.length > 0 ? (noShows / consultationData.length) * 100 : 0;

    setStats({
      todayTotal: todayConsultations.length,
      todayCompleted: completedToday,
      upcomingWeek,
      completionRate,
      averageDuration,
      noShowRate,
    });
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "in_person":
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: "secondary" as const, label: "Scheduled" },
      in_progress: { variant: "default" as const, label: "In Progress" },
      completed: { variant: "success" as const, label: "Completed" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
      no_show: { variant: "destructive" as const, label: "No Show" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleStartConsultation = async (consultation: Consultation) => {
    try {
      if (consultation.consultation_type === "video" && consultation.daily_room_url) {
        // Open Daily.co room in new tab
        window.open(consultation.daily_room_url, "_blank");
      }

      // Update consultation status to in_progress
      const { error } = await supabase
        .from("consultations")
        .update({
          consultation_status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", consultation.id);

      if (error) throw error;

      toast.success("Consultation started");
      fetchConsultations();
    } catch (error) {
      console.error("Error starting consultation:", error);
      toast.error("Failed to start consultation");
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedConsultation) return;

    try {
      const { error } = await supabase
        .from("consultations")
        .update({
          consultation_status: "completed",
          completed_at: new Date().toISOString(),
          consultation_notes: consultationNotes,
        })
        .eq("id", selectedConsultation.id);

      if (error) throw error;

      toast.success("Consultation completed");
      setShowNotesDialog(false);
      setSelectedConsultation(null);
      setConsultationNotes("");
      fetchConsultations();
    } catch (error) {
      console.error("Error completing consultation:", error);
      toast.error("Failed to complete consultation");
    }
  };

  const handleCancelConsultation = async (consultationId: string) => {
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ consultation_status: "cancelled" })
        .eq("id", consultationId);

      if (error) throw error;

      toast.success("Consultation cancelled");
      fetchConsultations();
    } catch (error) {
      console.error("Error cancelling consultation:", error);
      toast.error("Failed to cancel consultation");
    }
  };

  const filteredConsultations = consultations.filter((consultation) => {
    const searchLower = searchTerm.toLowerCase();
    const clientName =
      `${consultation.client?.first_name || ""} ${consultation.client?.last_name || ""}`.toLowerCase();
    const clientEmail = consultation.client?.email?.toLowerCase() || "";

    return (
      clientName.includes(searchLower) ||
      clientEmail.includes(searchLower) ||
      consultation.consultation_type.includes(searchLower)
    );
  });

  const todayConsultations = filteredConsultations.filter((c) => {
    if (!c.appointment || !c.appointment.appointment_date) return false;
    const appointmentDateTime = new Date(
      `${c.appointment.appointment_date}T${c.appointment.start_time}`
    );
    return isToday(appointmentDateTime);
  });

  const upcomingConsultations = filteredConsultations
    .filter((c) => {
      if (!c.appointment || !c.appointment.appointment_date) return false;
      const appointmentDateTime = new Date(
        `${c.appointment.appointment_date}T${c.appointment.start_time}`
      );
      return appointmentDateTime > new Date() && c.consultation_status === "scheduled";
    })
    .slice(0, 10); // Show next 10 upcoming

  const recentConsultations = filteredConsultations
    .filter((c) => c.consultation_status === "completed" || c.consultation_status === "cancelled")
    .slice(0, 20); // Show last 20

  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
                <p className="text-muted-foreground">Manage and track all client consultations</p>
              </div>
              <div className="flex items-center gap-2">
                <CreateTestDataButton />
                <Button variant="outline" asChild>
                  <Link href="/dashboard/consultations/analytics">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Analytics
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard/appointments">Schedule Consultation</Link>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Consultations</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayTotal}</div>
                  <p className="text-xs text-muted-foreground">{stats.todayCompleted} completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming (7 days)</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingWeek}</div>
                  <p className="text-xs text-muted-foreground">Scheduled consultations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Avg duration: {stats.averageDuration.toFixed(0)} min
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.noShowRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Missed appointments</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="recent" className="space-y-4">
              <TabsList>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="today">Today's Schedule</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Consultations</CardTitle>
                    <CardDescription>All consultations ordered by creation date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">Loading...</div>
                    ) : filteredConsultations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No consultations found
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Scheduled For</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredConsultations.slice(0, 20).map((consultation) => (
                            <TableRow key={consultation.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {consultation.client?.first_name || ""}{" "}
                                    {consultation.client?.last_name ||
                                      consultation.client?.email ||
                                      "Unknown Client"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {consultation.client?.email || "No email"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(consultation.created_at), "MMM d, h:mm a")}
                              </TableCell>
                              <TableCell>
                                {consultation.appointment?.appointment_date ? (
                                  <div>
                                    <p>
                                      {format(
                                        new Date(consultation.appointment.appointment_date),
                                        "MMM d, yyyy"
                                      )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {consultation.appointment.start_time
                                        ? format(
                                            new Date(
                                              `${consultation.appointment.appointment_date}T${consultation.appointment.start_time}`
                                            ),
                                            "h:mm a"
                                          )
                                        : "N/A"}
                                    </p>
                                  </div>
                                ) : (
                                  "No appointment"
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getConsultationIcon(consultation.consultation_type)}
                                  <span className="capitalize">
                                    {consultation.consultation_type.replace("_", " ")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(consultation.consultation_status)}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" asChild>
                                  <Link href={`/dashboard/consultations/${consultation.id}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="today" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>
                      Consultations scheduled for {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">Loading...</div>
                    ) : todayConsultations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No consultations scheduled for today
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todayConsultations.map((consultation) => (
                          <div
                            key={consultation.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                {getConsultationIcon(consultation.consultation_type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {consultation.client?.first_name || ""}{" "}
                                    {consultation.client?.last_name ||
                                      consultation.client?.email ||
                                      "Unknown Client"}
                                  </p>
                                  {getStatusBadge(consultation.consultation_status)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>
                                    {consultation.appointment?.start_time &&
                                    consultation.appointment?.appointment_date
                                      ? format(
                                          new Date(
                                            `${consultation.appointment.appointment_date}T${consultation.appointment.start_time}`
                                          ),
                                          "h:mm a"
                                        )
                                      : "N/A"}
                                  </span>
                                  <span>•</span>
                                  <span>{consultation.appointment?.service?.name || "N/A"}</span>
                                  <span>•</span>
                                  <span className="capitalize">
                                    {consultation.consultation_type.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {consultation.consultation_status === "scheduled" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartConsultation(consultation)}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Start
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelConsultation(consultation.id)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {consultation.consultation_status === "in_progress" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedConsultation(consultation);
                                    setShowNotesDialog(true);
                                  }}
                                >
                                  Complete
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/dashboard/consultations/${consultation.id}`}>
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Consultations</CardTitle>
                    <CardDescription>Scheduled consultations for the next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">Loading...</div>
                    ) : upcomingConsultations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No upcoming consultations
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingConsultations.map((consultation) => (
                            <TableRow key={consultation.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {consultation.client?.first_name || ""}{" "}
                                    {consultation.client?.last_name ||
                                      consultation.client?.email ||
                                      "Unknown Client"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {consultation.client?.email || "No email"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p>
                                    {consultation.appointment?.appointment_date
                                      ? format(
                                          new Date(consultation.appointment.appointment_date),
                                          "MMM d, yyyy"
                                        )
                                      : "N/A"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {consultation.appointment?.start_time
                                      ? format(
                                          new Date(
                                            `${consultation.appointment.appointment_date}T${consultation.appointment.start_time}`
                                          ),
                                          "h:mm a"
                                        )
                                      : "N/A"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getConsultationIcon(consultation.consultation_type)}
                                  <span className="capitalize">
                                    {consultation.consultation_type.replace("_", " ")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {consultation.appointment?.service?.name || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" asChild>
                                  <Link href={`/dashboard/consultations/${consultation.id}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Consultation History</CardTitle>
                    <CardDescription>Recent completed and cancelled consultations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">Loading...</div>
                    ) : recentConsultations.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No consultation history
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentConsultations.map((consultation) => {
                            const duration =
                              consultation.started_at && consultation.completed_at
                                ? Math.round(
                                    (new Date(consultation.completed_at).getTime() -
                                      new Date(consultation.started_at).getTime()) /
                                      60000
                                  )
                                : null;

                            return (
                              <TableRow key={consultation.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {consultation.client?.first_name || ""}{" "}
                                      {consultation.client?.last_name || ""}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {consultation.client?.email || "Unknown"}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {consultation.appointment?.appointment_date
                                    ? format(
                                        new Date(consultation.appointment.appointment_date),
                                        "MMM d, yyyy"
                                      )
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getConsultationIcon(consultation.consultation_type)}
                                    <span className="capitalize">
                                      {consultation.consultation_type.replace("_", " ")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{duration ? `${duration} min` : "-"}</TableCell>
                                <TableCell>
                                  {getStatusBadge(consultation.consultation_status)}
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/dashboard/consultations/${consultation.id}`}>
                                      View Details
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Complete Consultation Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Consultation</DialogTitle>
            <DialogDescription>
              Add notes about the consultation before marking it as complete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Consultation Notes</label>
              <Textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Enter consultation notes, key points discussed, and any follow-up actions..."
                rows={6}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNotesDialog(false);
                  setConsultationNotes("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCompleteConsultation}>Complete Consultation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
