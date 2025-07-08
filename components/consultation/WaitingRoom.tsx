"use client";

import { useState, useEffect } from "react";
import { ConsultationWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Phone, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, addMinutes } from "date-fns";
import Image from "next/image";

interface WaitingRoomProps {
  consultation: ConsultationWithRelations;
  onJoinCall: () => void;
}

export function WaitingRoom({ consultation, onJoinCall }: WaitingRoomProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [canJoin, setCanJoin] = useState(false);

  // Parse the appointment date and time properly
  const appointmentDateTime = (() => {
    try {
      // If start_time is already a full ISO string, use it directly
      const startTime = consultation.appointment.start_time;
      if (startTime.includes("T")) {
        return new Date(startTime);
      }

      // Otherwise combine date and time
      const date = consultation.appointment.appointment_date;
      const time = startTime;

      // Ensure proper format
      const dateOnly = date.split("T")[0];
      const timeOnly = time.includes("T") ? time.split("T")[1] : time;

      return new Date(`${dateOnly}T${timeOnly}`);
    } catch (e) {
      console.error("Error parsing appointment time:", e);
      // Return current time as fallback to allow immediate entry
      return new Date();
    }
  })();

  const earlyJoinTime = addMinutes(appointmentDateTime, -5); // Can join 5 minutes early
  const lateJoinTime = addMinutes(appointmentDateTime, 15); // Can't join after 15 minutes late

  useEffect(() => {
    // Log time details on mount
    console.log("Appointment time details:", {
      appointmentDate: consultation.appointment.appointment_date,
      startTime: consultation.appointment.start_time,
      parsedDateTime: appointmentDateTime.toISOString(),
      earlyJoinTime: earlyJoinTime.toISOString(),
      lateJoinTime: lateJoinTime.toISOString(),
      currentTime: new Date().toISOString(),
    });

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check if user can join
      const canJoinNow = isAfter(now, earlyJoinTime) && isBefore(now, lateJoinTime);
      setCanJoin(canJoinNow);
    }, 1000);

    return () => clearInterval(timer);
  }, [earlyJoinTime, lateJoinTime]);

  const getTimeStatus = () => {
    if (isBefore(currentTime, earlyJoinTime)) {
      const minutesUntil = Math.ceil((earlyJoinTime.getTime() - currentTime.getTime()) / 60000);
      return {
        status: "early",
        message: `You can join in ${minutesUntil} minute${minutesUntil !== 1 ? "s" : ""}`,
      };
    } else if (isAfter(currentTime, lateJoinTime)) {
      return {
        status: "late",
        message: "This consultation window has expired",
      };
    } else {
      return {
        status: "ready",
        message: "You can join the consultation now",
      };
    }
  };

  const timeStatus = getTimeStatus();
  const isVideo = consultation.consultation_type === "video";

  return (
    <div className="h-full flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-background">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image
              src="/soza-logo.png"
              alt="SOZA Massage"
              width={120}
              height={40}
              className="dark:invert"
            />
          </div>
          <CardTitle className="text-2xl">
            {isVideo ? "Video" : "Phone"} Consultation Waiting Room
          </CardTitle>
          <CardDescription>
            with {consultation.appointment.client.first_name}{" "}
            {consultation.appointment.client.last_name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Appointment Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Scheduled for: {format(appointmentDateTime, "MMMM d, yyyy at h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              <span>{isVideo ? "Video" : "Phone"} Consultation (30 minutes)</span>
            </div>
          </div>

          {/* Status Message */}
          <div
            className={`flex items-center gap-2 justify-center p-4 rounded-lg ${
              timeStatus.status === "ready"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : timeStatus.status === "early"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {timeStatus.status === "ready" ? (
              <CheckCircle className="h-5 w-5" />
            ) : timeStatus.status === "early" ? (
              <Clock className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{timeStatus.message}</span>
          </div>

          {/* Pre-consultation Checklist */}
          {isVideo && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Before you join:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Ensure you're in a quiet, private space</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Test your camera and microphone</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Have any relevant medical information ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Close other applications to ensure good connection</span>
                </li>
              </ul>
            </div>
          )}

          {/* Join Button */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <Button size="lg" onClick={onJoinCall} disabled={!canJoin} className="min-w-[200px]">
                {isVideo ? (
                  <>
                    <Video className="mr-2 h-5 w-5" />
                    Join Video Call
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-5 w-5" />
                    Start Phone Call
                  </>
                )}
              </Button>
            </div>

            {/* Development Override - Remove in production */}
            {process.env.NODE_ENV === "development" && !canJoin && (
              <div className="flex justify-center">
                <Button size="sm" variant="ghost" onClick={onJoinCall} className="text-xs">
                  Skip waiting (Dev mode)
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            Having trouble? Contact us at (555) 123-4567 or support@sozamassage.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
