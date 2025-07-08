"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";

export default function CheckPaymentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState({
    userHasPayments: false,
    paymentCount: 0,
    appointmentCount: 0,
    paidAppointments: 0,
    stripeCustomerId: null as string | null,
    recentPayments: [] as any[],
    webhookStatus: "unknown" as "working" | "not-configured" | "unknown",
  });

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  const runDiagnostics = async () => {
    setLoading(true);

    try {
      // Check user's payments
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Check user's appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", user!.id);

      const paidAppointments = appointments?.filter((apt) => apt.payment_status === "paid") || [];

      // Check if user has stripe customer ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user!.id)
        .single();

      // Check for recent payment events (indicates webhook is working)
      const { data: recentEvents } = await supabase
        .from("payment_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const webhookStatus = recentEvents && recentEvents.length > 0 ? "working" : "not-configured";

      setDiagnostics({
        userHasPayments: payments && payments.length > 0,
        paymentCount: payments?.length || 0,
        appointmentCount: appointments?.length || 0,
        paidAppointments: paidAppointments.length,
        stripeCustomerId: profile?.stripe_customer_id,
        recentPayments: payments || [],
        webhookStatus,
      });
    } catch (error) {
      console.error("Diagnostics error:", error);
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

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Payment Diagnostics" description="Checking your payment system status" />

      <div className="space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payment System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span>Database Payments:</span>
                <Badge variant={diagnostics.paymentCount > 0 ? "default" : "secondary"}>
                  {diagnostics.paymentCount} found
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Stripe Customer ID:</span>
                <Badge variant={diagnostics.stripeCustomerId ? "default" : "destructive"}>
                  {diagnostics.stripeCustomerId ? "Configured" : "Not Set"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Total Appointments:</span>
                <Badge variant="outline">{diagnostics.appointmentCount}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Paid Appointments:</span>
                <Badge variant="outline">{diagnostics.paidAppointments}</Badge>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-muted">
              <div className="flex items-start gap-3">
                {diagnostics.webhookStatus === "working" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    Webhook Status:{" "}
                    {diagnostics.webhookStatus === "working" ? "Active" : "Not Configured"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {diagnostics.webhookStatus === "working"
                      ? "Your Stripe webhook is properly configured and receiving events."
                      : "No recent webhook events found. Ensure your Stripe webhook is configured."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnosis Results */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostics.paymentCount === 0 ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium">No payments found in database</p>
                    <p className="text-sm text-muted-foreground">This could mean:</p>
                    <ul className="text-sm text-muted-foreground ml-4 list-disc space-y-1">
                      <li>Stripe webhook is not configured to save payments to database</li>
                      <li>Payments were made before the system was implemented</li>
                      <li>There's an issue with the payment recording process</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium mb-2">Recommended Actions:</h4>
                  <ol className="text-sm space-y-2 list-decimal ml-4">
                    <li>
                      <strong>Configure Stripe Webhook:</strong> Go to Stripe Dashboard → Webhooks →
                      Add endpoint
                      <br />
                      Endpoint URL:{" "}
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                        https://yourdomain.com/api/stripe/webhook
                      </code>
                    </li>
                    <li>
                      <strong>Add Webhook Secret:</strong> Copy the signing secret and add to your
                      environment variables:
                      <br />
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                        STRIPE_WEBHOOK_SECRET=whsec_...
                      </code>
                    </li>
                    <li>
                      <strong>Import Historical Payments:</strong> Run the import script to bring in
                      past payments
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Payment system is working</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Found {diagnostics.paymentCount} payment(s) in the database.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        {diagnostics.recentPayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Last 5 payments in database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnostics.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">{formatPrice(payment.amount_cents)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()} - {payment.status}
                      </p>
                    </div>
                    <Badge variant={payment.status === "succeeded" ? "default" : "secondary"}>
                      {payment.stripe_payment_intent_id ? "Stripe" : "Manual"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
