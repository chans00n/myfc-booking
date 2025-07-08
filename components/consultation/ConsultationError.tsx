"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConsultationErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ConsultationError({ error, reset }: ConsultationErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Consultation room error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/5 to-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 text-destructive rounded-full w-fit">
            <AlertCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Consultation Room Error</CardTitle>
          <CardDescription>
            We encountered an issue setting up your consultation room
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">What happened?</p>
            <p className="text-sm text-muted-foreground">
              {error.message || "An unexpected error occurred while loading the consultation room."}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
            )}
          </div>

          {/* Troubleshooting Steps */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Try these steps:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span>Check your internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span>Ensure your browser allows camera and microphone access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span>Try refreshing the page or using a different browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                <span>Disable any ad blockers or VPN services</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} className="flex-1" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push("/booking/my-appointments")}
              className="flex-1"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Appointments
            </Button>
          </div>

          {/* Support Contact */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Still having trouble? Contact us for help:
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              <a href="tel:+15551234567" className="text-primary hover:underline">
                (555) 123-4567
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
