"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-muted inline-flex">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>You're Offline</CardTitle>
          <CardDescription>
            It looks like you've lost your internet connection. Please check your connection and try
            again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Some features may be limited while offline
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
