"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ConsultationNotificationPreferences {
  consultation_confirmation: boolean;
  consultation_24h_reminder: boolean;
  consultation_1h_reminder: boolean;
  consultation_15min_reminder: boolean;
  consultation_followup: boolean;
  admin_consultation_booked: boolean;
  admin_consultation_joined: boolean;
  admin_consultation_completed: boolean;
  admin_consultation_digest: boolean;
}

export function ConsultationNotificationSettings({ userId }: { userId: string }) {
  const [preferences, setPreferences] = useState<ConsultationNotificationPreferences>({
    consultation_confirmation: true,
    consultation_24h_reminder: true,
    consultation_1h_reminder: true,
    consultation_15min_reminder: false,
    consultation_followup: true,
    admin_consultation_booked: true,
    admin_consultation_joined: true,
    admin_consultation_completed: true,
    admin_consultation_digest: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPreferences((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof ConsultationNotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Notifications</CardTitle>
        <CardDescription>Configure notification settings for consultations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Client Notifications</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="consultation_confirmation">Consultation Confirmation</Label>
                <p className="text-sm text-muted-foreground">
                  Send confirmation email when consultation is booked
                </p>
              </div>
              <Switch
                id="consultation_confirmation"
                checked={preferences.consultation_confirmation}
                onCheckedChange={() => handleToggle("consultation_confirmation")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="consultation_24h_reminder">24-Hour Reminder</Label>
                <p className="text-sm text-muted-foreground">
                  Email reminder 24 hours before consultation
                </p>
              </div>
              <Switch
                id="consultation_24h_reminder"
                checked={preferences.consultation_24h_reminder}
                onCheckedChange={() => handleToggle("consultation_24h_reminder")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="consultation_1h_reminder">1-Hour Reminder</Label>
                <p className="text-sm text-muted-foreground">
                  Email reminder 1 hour before consultation
                </p>
              </div>
              <Switch
                id="consultation_1h_reminder"
                checked={preferences.consultation_1h_reminder}
                onCheckedChange={() => handleToggle("consultation_1h_reminder")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="consultation_15min_reminder">15-Minute SMS Reminder</Label>
                <p className="text-sm text-muted-foreground">
                  SMS reminder 15 minutes before consultation (requires phone number)
                </p>
              </div>
              <Switch
                id="consultation_15min_reminder"
                checked={preferences.consultation_15min_reminder}
                onCheckedChange={() => handleToggle("consultation_15min_reminder")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="consultation_followup">Follow-up Email</Label>
                <p className="text-sm text-muted-foreground">
                  Send thank you email with special offer after consultation
                </p>
              </div>
              <Switch
                id="consultation_followup"
                checked={preferences.consultation_followup}
                onCheckedChange={() => handleToggle("consultation_followup")}
              />
            </div>
          </div>
        </div>

        {/* Admin Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Admin Notifications</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="admin_consultation_booked">New Consultation Booked</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when a new consultation is scheduled
                </p>
              </div>
              <Switch
                id="admin_consultation_booked"
                checked={preferences.admin_consultation_booked}
                onCheckedChange={() => handleToggle("admin_consultation_booked")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="admin_consultation_joined">Client Joined Room</Label>
                <p className="text-sm text-muted-foreground">
                  Real-time notification when client joins video call
                </p>
              </div>
              <Switch
                id="admin_consultation_joined"
                checked={preferences.admin_consultation_joined}
                onCheckedChange={() => handleToggle("admin_consultation_joined")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="admin_consultation_completed">Consultation Completed</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when consultation status changes to completed
                </p>
              </div>
              <Switch
                id="admin_consultation_completed"
                checked={preferences.admin_consultation_completed}
                onCheckedChange={() => handleToggle("admin_consultation_completed")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="admin_consultation_digest">Daily Consultation Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Daily summary of consultation activity
                </p>
              </div>
              <Switch
                id="admin_consultation_digest"
                checked={preferences.admin_consultation_digest}
                onCheckedChange={() => handleToggle("admin_consultation_digest")}
              />
            </div>
          </div>
        </div>

        <Button onClick={savePreferences} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
