import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSeedCompanyData() {
  const { session } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!session || hasRun.current) return;
    hasRun.current = true;

    // Fire and forget — seed is idempotent
    supabase.functions.invoke("seed-company-data").catch((err) => {
      console.error("Seed error (non-critical):", err);
    });
  }, [session]);
}
