"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConsultationWithRelations } from "@/types";
import { IntakeForm } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { VideoInterface } from "./VideoInterface";
import { WaitingRoom } from "./WaitingRoom";
import { ConsultationTimer } from "./ConsultationTimer";
import { ConsultationNotes } from "./ConsultationNotes";
import { ClientInfo } from "./ClientInfo";
import { ConsultationControls } from "./ConsultationControls";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import "./consultation-room.css";

interface ConsultationRoomProps {
  consultation: ConsultationWithRelations;
  intakeForm: IntakeForm | null;
  isAdmin: boolean;
  userToken?: string;
}

export function ConsultationRoom({
  consultation,
  intakeForm,
  isAdmin,
  userToken,
}: ConsultationRoomProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(true);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [consultationStartTime, setConsultationStartTime] = useState<Date | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);

  useEffect(() => {
    console.log("ConsultationRoom useEffect:", {
      hasRoomUrl: !!consultation.daily_room_url,
      hasUserToken: !!userToken,
      hasRoomToken: !!consultation.daily_room_token,
      isAdmin,
      consultationId: consultation.id,
      hasJoinedCall,
    });

    // Only load room data after user has joined
    if (!hasJoinedCall) {
      setIsLoading(false);
      return;
    }

    // If room already exists, use it
    if (consultation.daily_room_url && userToken) {
      setRoomUrl(consultation.daily_room_url);
      setToken(userToken);
      setIsLoading(false);
    } else if (consultation.daily_room_url && consultation.daily_room_token && isAdmin) {
      setRoomUrl(consultation.daily_room_url);
      setToken(consultation.daily_room_token);
      setIsLoading(false);
    } else {
      // Create room if it doesn't exist
      createConsultationRoom();
    }
  }, [consultation, userToken, isAdmin, hasJoinedCall]);

  const createConsultationRoom = async () => {
    console.log("Creating consultation room for:", consultation.id);
    try {
      const response = await fetch("/api/consultations/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultationId: consultation.id,
          clientName: `${consultation.client.first_name} ${consultation.client.last_name}`,
          therapistName: "SOZA Therapist",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to create consultation room");
      }

      const data = await response.json();
      setRoomUrl(data.roomUrl);

      // Set appropriate token based on user role
      if (isAdmin) {
        setToken(data.therapistToken);
      } else {
        setToken(data.clientToken);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error creating consultation room:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create consultation room");
      setIsLoading(false);
    }
  };

  const handleJoinCall = () => {
    setIsInWaitingRoom(false);
    setHasJoinedCall(true);
    setConsultationStartTime(new Date());

    // Update consultation status to in_progress
    updateConsultationStatus("in_progress");
  };

  const handleEndCall = async () => {
    try {
      // Update consultation status to completed
      await updateConsultationStatus("completed");

      toast.success("Consultation ended successfully");
      router.push("/booking/my-appointments");
    } catch (error) {
      console.error("Error ending consultation:", error);
      toast.error("Failed to end consultation properly");
    }
  };

  const updateConsultationStatus = async (status: "in_progress" | "completed") => {
    try {
      const response = await fetch(`/api/consultations/${consultation.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update consultation status");
      }
    } catch (error) {
      console.error("Error updating consultation status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up consultation room...</p>
        </div>
      </div>
    );
  }

  if (!roomUrl || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to Setup Consultation</h1>
          <p className="text-muted-foreground mb-4">
            There was an error setting up your consultation room.
          </p>
          <Button onClick={() => router.push("/booking/my-appointments")}>
            Return to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen lg:h-full lg:min-h-0">
        {/* Header */}
        <header className="border-b bg-card flex-shrink-0">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-base sm:text-lg font-semibold">
                {consultation.consultation_type === "video" ? "Video" : "Phone"} Consultation
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {format(
                  new Date(
                    consultation.appointment.appointment_date +
                      "T" +
                      consultation.appointment.start_time
                  ),
                  "MMM d, yyyy h:mm a"
                )}
              </p>
            </div>
            {consultationStartTime && (
              <ConsultationTimer startTime={consultationStartTime} maxDuration={30} />
            )}
          </div>
        </header>

        {/* Video/Call Area */}
        <div className="flex-1 relative" style={{ minHeight: "400px" }}>
          {isInWaitingRoom ? (
            <WaitingRoom consultation={consultation} onJoinCall={handleJoinCall} />
          ) : hasJoinedCall && roomUrl && token ? (
            <VideoInterface
              roomUrl={roomUrl}
              token={token}
              isVideo={consultation.consultation_type === "video"}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Setting up consultation room...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {!isInWaitingRoom && hasJoinedCall && (
          <div className="flex-shrink-0 bg-card border-t">
            <ConsultationControls
              onEndCall={handleEndCall}
              onToggleNotes={() => setShowNotes(!showNotes)}
              onToggleClientInfo={() => setShowClientInfo(!showClientInfo)}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>

      {/* Sidebar - Desktop */}
      {isAdmin && !isInWaitingRoom && (showNotes || showClientInfo) && (
        <>
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-96 border-l bg-card overflow-y-auto">
            {showClientInfo && (
              <ClientInfo
                client={consultation.client}
                intakeForm={intakeForm}
                consultation={consultation}
              />
            )}
            {showNotes && (
              <ConsultationNotes
                consultationId={consultation.id}
                initialNotes={consultation.consultation_notes}
              />
            )}
          </aside>

          {/* Mobile Drawer */}
          <div className="lg:hidden">
            {(showNotes || showClientInfo) && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                <div className="fixed inset-x-0 bottom-0 max-h-[80vh] bg-card border-t rounded-t-xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">
                      {showNotes ? "Consultation Notes" : "Client Information"}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowNotes(false);
                        setShowClientInfo(false);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="max-h-[calc(80vh-4rem)] overflow-y-auto">
                    {showClientInfo && (
                      <ClientInfo
                        client={consultation.client}
                        intakeForm={intakeForm}
                        consultation={consultation}
                      />
                    )}
                    {showNotes && (
                      <ConsultationNotes
                        consultationId={consultation.id}
                        initialNotes={consultation.consultation_notes}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
