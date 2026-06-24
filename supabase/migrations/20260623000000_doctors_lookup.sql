-- ============================================================
-- AfyaLink HMS — Doctor Lookup for Check-In & Assignment
-- Created : 2026-06-23
-- ============================================================
-- Purpose:
--   Enables any approved user to read profiles for users who hold
--   a clinical role (Doctor or Clinician), so the CheckInDialog
--   and other portals can populate the "Assigned Doctor" dropdown
--   from real database records instead of hardcoded names.
--
-- What this migration does:
--   1. Creates a security-definer function get_clinical_staff()
--      that returns id + full_name for all approved Doctor /
--      Clinician profiles.  Security-definer lets any authenticated
--      user call it without needing SELECT on profiles directly.
--   2. Adds a thin RLS policy so authenticated users can SELECT
--      profiles rows where the profile belongs to a Doctor or
--      Clinician (required for direct Supabase client queries in
--      the CheckInDialog).
-- ============================================================

-- ── 1. Helper function: get_clinical_staff() ────────────────────
--
-- Returns (id uuid, full_name text, role app_role) for every
-- approved profile that has a Doctor or Clinician role entry.
-- Runs as the postgres superuser (SECURITY DEFINER) so it bypasses
-- RLS and can be safely called by any authenticated role.

CREATE OR REPLACE FUNCTION public.get_clinical_staff()
RETURNS TABLE (id uuid, full_name text, role public.app_role)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    p.id,
    p.full_name,
    ur.role
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE
    p.status = 'approved'
    AND ur.role IN ('Doctor', 'Clinician')
  ORDER BY p.full_name;
$$;

-- Allow every authenticated user to call this function
REVOKE ALL ON FUNCTION public.get_clinical_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clinical_staff() TO authenticated;

-- ── 2. RLS policy: let authenticated users read clinical-staff profiles ──
--
-- The CheckInDialog queries profiles directly via the Supabase
-- client (.from("profiles").select(...)).  For that to work we
-- need a permissive SELECT policy that covers Doctor/Clinician rows.
-- The existing RLS on profiles only allows a user to read their
-- own row; this policy extends that for clinical-staff lookup.

DROP POLICY IF EXISTS "authenticated_read_clinical_staff_profiles" ON public.profiles;
CREATE POLICY "authenticated_read_clinical_staff_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- The viewer is authenticated (any approved user) AND the row
    -- they are reading belongs to an approved Doctor or Clinician.
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = profiles.id
        AND ur.role IN ('Doctor', 'Clinician')
    )
  );

-- ── 3. RLS policy: authenticated users can read user_roles for lookup ──
--
-- The CheckInDialog joins user_roles to filter by role.
-- We need authenticated users to be able to SELECT from user_roles
-- for Doctor/Clinician entries (not just their own row).

DROP POLICY IF EXISTS "authenticated_read_clinical_roles" ON public.user_roles;
CREATE POLICY "authenticated_read_clinical_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    role IN ('Doctor', 'Clinician')
  );
