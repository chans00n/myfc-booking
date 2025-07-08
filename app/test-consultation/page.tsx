"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Video, Calendar, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function TestConsultationPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const supabase = createClient();

      // First check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view consultations");
        setLoading(false);
        return;
      }

      // Fetch consultations with appointment details
      const { data, error: fetchError } = await supabase
        .from("consultations")
        .select(
          `
          *,
          appointments!inner(
            appointment_date,
            start_time,
            status
          ),
          profiles!consultations_client_id_fkey(
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error("Error fetching consultations:", fetchError);
        setError("Failed to load consultations");
      } else {
        setConsultations(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Consultation Room</h1>
          <p className="text-muted-foreground">
            View and test your consultation rooms. Click on any consultation to enter the room.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {consultations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No consultations found.</p>
              <Button asChild>
                <Link href="/booking">Book a Consultation</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <Card key={consultation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        {consultation.consultation_type} Consultation
                      </CardTitle>
                      <CardDescription>
                        {consultation.profiles?.first_name} {consultation.profiles?.last_name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(consultation.consultation_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {consultation.appointments?.appointment_date
                          ? (() => {
                              try {
                                const date = new Date(consultation.appointments.appointment_date);
                                return isNaN(date.getTime())
                                  ? "Invalid date"
                                  : format(date, "EEEE, MMMM d, yyyy");
                              } catch (e) {
                                return "Invalid date";
                              }
                            })()
                          : "No date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {consultation.appointments?.start_time
                          ? (() => {
                              try {
                                const date = new Date(consultation.appointments.start_time);
                                return isNaN(date.getTime())
                                  ? "Invalid time"
                                  : format(date, "h:mm a");
                              } catch (e) {
                                return "Invalid time";
                              }
                            })()
                          : "No time"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium mb-2">Debug Info:</p>
                    <p className="text-xs text-muted-foreground break-all">
                      Consultation ID: {consultation.id}
                    </p>
                    {consultation.daily_room_url && (
                      <>
                        <p className="text-xs text-muted-foreground break-all mt-1">
                          Room URL: {consultation.daily_room_url}
                        </p>
                        {consultation.daily_room_name && (
                          <p className="text-xs text-muted-foreground">
                            Room Name: {consultation.daily_room_name}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/consultation/${consultation.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Enter Consultation Room
                      </Link>
                    </Button>
                    {consultation.consultation_status === "scheduled" && (
                      <Button variant="outline" asChild>
                        <Link href={`/consultation/${consultation.id}?role=admin`}>
                          Enter as Therapist
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Click "Enter Consultation Room" to join as a client</li>
            <li>• Click "Enter as Therapist" to see the admin view with notes</li>
            <li>• You can open both in different browser tabs to test the full experience</li>
            <li>• The waiting room opens 5 minutes before the scheduled time</li>
            <li>• Video rooms are only available for video consultations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
