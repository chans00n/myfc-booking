import { Button } from "@/components/ui/button";
import { Play, X, CheckCircle, RefreshCw } from "lucide-react";

interface ConsultationQuickActionsProps {
  consultationId: string;
  status: string;
  consultationType: "phone" | "video" | "in_person";
  roomUrl?: string | null;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  size?: "sm" | "default";
}

export function ConsultationQuickActions({
  consultationId,
  status,
  consultationType,
  roomUrl,
  onStart,
  onComplete,
  onCancel,
  onReschedule,
  size = "default",
}: ConsultationQuickActionsProps) {
  if (status === "scheduled") {
    return (
      <div className="flex items-center gap-2">
        <Button size={size} onClick={onStart}>
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
        <Button size={size} variant="outline" onClick={onReschedule}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Reschedule
        </Button>
        <Button size={size} variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <div className="flex items-center gap-2">
        {consultationType === "video" && roomUrl && (
          <Button size={size} variant="outline" onClick={() => window.open(roomUrl, "_blank")}>
            Rejoin Room
          </Button>
        )}
        <Button size={size} variant="secondary" onClick={onComplete}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Complete
        </Button>
      </div>
    );
  }

  return null;
}
