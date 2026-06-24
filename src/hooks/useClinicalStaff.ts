/**
 * useClinicalStaff
 *
 * Returns all approved Doctor and Clinician profiles via the
 * get_clinical_staff() Supabase RPC function (SECURITY DEFINER),
 * which bypasses RLS entirely and avoids the infinite-recursion
 * error that a direct .from("profiles").select(...).in("user_roles.role")
 * join caused on the profiles table policies.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ClinicalStaffMember = {
  id: string;
  full_name: string;
  role: "Doctor" | "Clinician";
};

type UseClinicalStaffResult = {
  staff: ClinicalStaffMember[];
  loading: boolean;
  error: string | null;
};

export function useClinicalStaff(): UseClinicalStaffResult {
  const [staff, setStaff] = useState<ClinicalStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStaff = async () => {
      setLoading(true);
      setError(null);

      // Call the SECURITY DEFINER RPC function — safe, no RLS loop.
      const { data, error: rpcErr } = await supabase.rpc("get_clinical_staff");

      if (cancelled) return;

      if (rpcErr) {
        console.error("useClinicalStaff: RPC failed", rpcErr.message);
        setError(rpcErr.message);
        setStaff([]);
      } else {
        const mapped: ClinicalStaffMember[] = (data ?? []).map(
          (row: { id: string; full_name: string; role: string }) => ({
            id: row.id,
            full_name: row.full_name,
            role: row.role as "Doctor" | "Clinician",
          }),
        );
        setStaff(mapped);
      }

      setLoading(false);
    };

    fetchStaff();
    return () => {
      cancelled = true;
    };
  }, []);

  return { staff, loading, error };
}
