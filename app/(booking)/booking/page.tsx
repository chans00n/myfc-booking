"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookingProvider } from "@/contexts/BookingContext";
import { ConsultationBookingWizard } from "@/components/booking/ConsultationBookingWizard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

function BookingContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("service");
  const rescheduleId = searchParams.get("reschedule");

  return (
    <>
      {rescheduleId && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            You are rescheduling an existing appointment. Your previous appointment will be
            automatically cancelled once you confirm the new time.
          </AlertDescription>
        </Alert>
      )}
      <ConsultationBookingWizard />
    </>
  );
}

export default function BookingPage() {
  return (
    <BookingProvider>
      <PageContainer>
        <Suspense fallback={<div>Loading...</div>}>
          <BookingContent />
        </Suspense>
      </PageContainer>
    </BookingProvider>
  );
}