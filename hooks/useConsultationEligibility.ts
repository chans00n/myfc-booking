import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface ConsultationEligibility {
  isEligible: boolean;
  consultationCount: number;
  lastConsultationDate: Date | null;
  loading: boolean;
  error: string | null;
}

export function useConsultationEligibility(): ConsultationEligibility {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<ConsultationEligibility>({
    isEligible: true, // Default to true for non-logged-in users
    consultationCount: 0,
    lastConsultationDate: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function checkEligibility() {
      // If no user, they're eligible (will need to create account during booking)
      if (!user) {
        setEligibility({
          isEligible: true,
          consultationCount: 0,
          lastConsultationDate: null,
          loading: false,
          error: null,
        });
        return;
      }

      try {
        const supabase = createClient();

        console.log("Checking consultation eligibility for user:", user.id);

        // Check eligibility using the database function
        const { data, error } = await supabase.rpc("check_consultation_eligibility", {
          p_client_id: user.id,
        });

        console.log("Eligibility check result:", data, error);

        if (error) throw error;

        // Get consultation history
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("consultation_count, last_consultation_date, has_had_free_consultation")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setEligibility({
          isEligible: data === true,
          consultationCount: profile?.consultation_count || 0,
          lastConsultationDate: profile?.last_consultation_date
            ? new Date(profile.last_consultation_date)
            : null,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error checking consultation eligibility:", error);
        setEligibility((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to check consultation eligibility",
        }));
      }
    }

    checkEligibility();
  }, [user]);

  return eligibility;
}
