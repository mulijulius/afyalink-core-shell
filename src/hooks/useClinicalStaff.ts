/**
 * useClinicalStaff
 *
 * Returns all approved Doctor and Clinician profiles from Supabase
 * so that any portal (Admin, Nurse, Doctor, Clinician) can populate
 * the "Assigned Doctor / Clinician" select without hardcoded names.
 *
 * Relies on:
 *   • The RLS policies added in migration 20260623000000_doctors_lookup.sql
 *     that allow authenticated users to SELECT profiles where the user
 *     has a Doctor or Clinician role.
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

      // Join profiles + user_roles to get approved Doctor / Clinician users.
      // The migration 20260623000000_doctors_lookup.sql adds the RLS policies
      // that allow this query for any authenticated user.
      const { data, error: qErr } = await supabase
        .from("profiles")
        .select(
          "id, full_name, user_roles!inner(role)",
        )
        .eq("status", "approved")
        .in("user_roles.role", ["Doctor", "Clinician"])
        .order("full_name");

      if (cancelled) return;

      if (qErr) {
        console.error("useClinicalStaff: failed to fetch staff", qErr.message);
        setError(qErr.message);
        setStaff([]);
      } else {
        const mapped: ClinicalStaffMember[] = (data ?? []).map((row: {
          id: string;
          full_name: string;
          user_roles: { role: string }[] | { role: string };
        }) => {
          // user_roles comes back as array when using !inner
          const rolesArr = Array.isArray(row.user_roles)
            ? row.user_roles
            : [row.user_roles];
          const role = rolesArr[0]?.role as "Doctor" | "Clinician";
          return {
            id: row.id,
            full_name: row.full_name,
            role,
          };
        });
        setStaff(mapped);
      }

      setLoading(false);
    };

    fetchStaff();
    return () => { cancelled = true; };
  }, []);

  return { staff, loading, error };
}
