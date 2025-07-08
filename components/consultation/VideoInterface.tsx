"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Phone } from "lucide-react";

interface VideoInterfaceProps {
  roomUrl: string;
  token: string;
  isVideo: boolean;
}

export function VideoInterface({ roomUrl, token, isVideo }: VideoInterfaceProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Add the token to the room URL
    if (iframeRef.current && roomUrl && token) {
      const urlWithToken = `${roomUrl}?t=${token}`;
      iframeRef.current.src = urlWithToken;
    }
  }, [roomUrl, token]);

  if (!isVideo) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-8 text-center">
          <Phone className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Phone Consultation Active</h2>
          <p className="text-muted-foreground">
            Your phone consultation is in progress. Please ensure you're in a quiet environment.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative">
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        style={{
          border: "none",
          backgroundColor: "#000",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Daily.co Branding Override */}
      <style jsx global>{`
        /* Hide Daily.co branding elements */
        .daily-video-call iframe {
          border: none !important;
        }

        /* Custom styling for Daily.co UI */
        .daily-prejoin-ui {
          background-color: var(--background) !important;
        }

        .daily-video-container {
          background-color: #000 !important;
        }
      `}</style>
    </div>
  );
}
