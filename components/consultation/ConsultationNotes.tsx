"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "lodash";

interface ConsultationNotesProps {
  consultationId: string;
  initialNotes?: string | null;
}

export function ConsultationNotes({ consultationId, initialNotes }: ConsultationNotesProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const supabase = createClient();

  // Auto-save notes with debounce
  const debouncedSave = useCallback(
    debounce(async (notesContent: string) => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("consultations")
          .update({ consultation_notes: notesContent })
          .eq("id", consultationId);

        if (error) throw error;

        setHasChanges(false);
        toast.success("Notes saved automatically");
      } catch (error) {
        console.error("Error saving notes:", error);
        toast.error("Failed to save notes");
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [consultationId]
  );

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
    debouncedSave(value);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ consultation_notes: notes })
        .eq("id", consultationId);

      if (error) throw error;

      setHasChanges(false);
      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  // Save notes before unmounting
  useEffect(() => {
    return () => {
      if (hasChanges) {
        debouncedSave.flush();
      }
    };
  }, [hasChanges, debouncedSave]);

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Consultation Notes
            </CardTitle>
            <CardDescription>Notes are auto-saved as you type</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Suggested sections */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Suggested sections:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Chief complaint & symptoms</li>
              <li>Assessment findings</li>
              <li>Treatment recommendations</li>
              <li>Follow-up plan</li>
              <li>Home care instructions</li>
            </ul>
          </div>

          {/* Notes textarea */}
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Enter consultation notes here..."
            className="min-h-[400px] resize-none"
          />

          {/* Status indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isSaving ? "Saving..." : hasChanges ? "Unsaved changes" : "All changes saved"}
            </span>
            <span>{notes.length} characters</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
