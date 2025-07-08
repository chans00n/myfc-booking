"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Settings,
  CreditCard,
  Save,
  Mail,
  Phone,
  Bell,
  MessageSquare,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";

interface Payment {
  id: string;
  amount_cents: number;
  status: string;
  payment_method_type: string | null;
  created_at: string;
  paid_at: string | null;
  receipt_url: string | null;
  appointment: {
    appointment_date: string;
    service: {
      name: string;
    } | null;
  } | null;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  booking_confirmation: boolean;
  appointment_reminder_24h: boolean;
  appointment_reminder_2h: boolean;
  cancellation_notification: boolean;
  rescheduling_notification: boolean;
  intake_form_reminder: boolean;
  follow_up_emails: boolean;
  marketing_emails: boolean;
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_enabled: true,
    sms_enabled: false,
    booking_confirmation: true,
    appointment_reminder_24h: true,
    appointment_reminder_2h: true,
    cancellation_notification: true,
    rescheduling_notification: true,
    intake_form_reminder: true,
    follow_up_emails: true,
    marketing_emails: false,
  });

  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
      fetchNotificationSettings();
    }
  }, [user]);

  const fetchPaymentHistory = async () => {
    if (!user) return;

    setPaymentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          id,
          amount_cents,
          status,
          payment_method_type,
          created_at,
          receipt_url,
          paid_at,
          appointment_id,
          appointments!payments_appointment_id_fkey(
            appointment_date,
            services!appointments_service_id_fkey(
              name
            )
          )
        `
        )
        .eq("client_id", user.id)
        .in("status", ["succeeded", "partially_refunded", "refunded"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData =
        data?.map((payment) => {
          const appointment = payment.appointments || null;
          return {
            id: payment.id,
            amount_cents: payment.amount_cents,
            status: payment.status,
            payment_method_type: payment.payment_method_type,
            created_at: payment.created_at,
            paid_at: payment.paid_at,
            receipt_url: payment.receipt_url,
            appointment: appointment
              ? {
                  appointment_date: appointment.appointment_date,
                  service: appointment.services || null,
                }
              : null,
          };
        }) || [];

      setPayments(transformedData);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("Failed to load payment history");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setNotifications({
          email_enabled: data.email_enabled,
          sms_enabled: data.sms_enabled,
          booking_confirmation: data.booking_confirmation,
          appointment_reminder_24h: data.appointment_reminder_24h,
          appointment_reminder_2h: data.appointment_reminder_2h,
          cancellation_notification: data.cancellation_notification,
          rescheduling_notification: data.rescheduling_notification,
          intake_form_reminder: data.intake_form_reminder,
          follow_up_emails: data.follow_up_emails,
          marketing_emails: data.marketing_emails,
        });
      }
    } catch (error: any) {
      console.error("Error fetching notification preferences:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: user.id,
        email_enabled: notifications.email_enabled,
        sms_enabled: notifications.sms_enabled,
        booking_confirmation: notifications.booking_confirmation,
        appointment_reminder_24h: notifications.appointment_reminder_24h,
        appointment_reminder_2h: notifications.appointment_reminder_2h,
        cancellation_notification: notifications.cancellation_notification,
        rescheduling_notification: notifications.rescheduling_notification,
        intake_form_reminder: notifications.intake_form_reminder,
        follow_up_emails: notifications.follow_up_emails,
        marketing_emails: notifications.marketing_emails,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Notification preferences updated");
    } catch (error: any) {
      console.error("Error updating notification preferences:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <PageContainer>
      <PageHeader title="My Profile" description="Manage your account settings and preferences" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} disabled className="flex-1" />
                </div>
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label>Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email_enabled}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <Label>SMS Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via text message
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms_enabled}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms_enabled: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Appointment Notifications</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Confirmations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when appointments are booked
                    </p>
                  </div>
                  <Switch
                    checked={notifications.booking_confirmation}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, booking_confirmation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>24-Hour Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded 24 hours before appointments
                    </p>
                  </div>
                  <Switch
                    checked={notifications.appointment_reminder_24h}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, appointment_reminder_24h: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>2-Hour Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded 2 hours before appointments
                    </p>
                  </div>
                  <Switch
                    checked={notifications.appointment_reminder_2h}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, appointment_reminder_2h: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cancellations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified if appointments are cancelled
                    </p>
                  </div>
                  <Switch
                    checked={notifications.cancellation_notification}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, cancellation_notification: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rescheduling</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when appointments are rescheduled
                    </p>
                  </div>
                  <Switch
                    checked={notifications.rescheduling_notification}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, rescheduling_notification: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Intake Form Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded to complete intake forms
                    </p>
                  </div>
                  <Switch
                    checked={notifications.intake_form_reminder}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, intake_form_reminder: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Other Communications</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Follow-up Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive follow-up emails after appointments
                    </p>
                  </div>
                  <Switch
                    checked={notifications.follow_up_emails}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, follow_up_emails: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional offers and updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketing_emails}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, marketing_emails: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleUpdateNotifications}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View your past payments and receipts</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {payment.appointment?.service?.name || "Service"}
                          </p>
                          {payment.status === "refunded" && (
                            <Badge variant="secondary">Refunded</Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Paid{" "}
                              {format(
                                new Date(payment.paid_at || payment.created_at),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                          {payment.appointment?.appointment_date && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span>
                                For appointment on{" "}
                                {format(
                                  new Date(payment.appointment.appointment_date + "T00:00:00"),
                                  "MMM d"
                                )}
                              </span>
                            </>
                          )}
                          <span className="hidden sm:inline">•</span>
                          <span>{payment.payment_method_type || "Card"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <p className="font-semibold text-lg">{formatPrice(payment.amount_cents)}</p>
                        {payment.receipt_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              Receipt
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
