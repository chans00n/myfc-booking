"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestAuthPage() {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();

      try {
        // Check session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        let profileData = null;
        let profileError = null;

        if (session?.user) {
          // Try to fetch profile
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          profileData = data;
          profileError = error;
        }

        setStatus({
          session,
          sessionError,
          profileData,
          profileError,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        });
      } catch (error) {
        setStatus({ error: error.message });
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return <div className="p-8">Loading direct auth check...</div>;
  }

  return (
    <div className="p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Direct Auth Test (No Context)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(status, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
