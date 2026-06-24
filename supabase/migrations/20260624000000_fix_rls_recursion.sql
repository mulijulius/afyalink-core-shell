-- ============================================================
-- AfyaLink HMS — Fix: Infinite Recursion in profiles RLS
-- Created : 2026-06-24
-- ============================================================
--
-- ROOT CAUSE
-- ----------
-- Migration 20260623000000_doctors_lookup.sql added two RLS
-- policies that created circular evaluation chains:
--
--   1. "authenticated_read_clinical_staff_profiles" on profiles:
--        USING (status = 'approved'
--               AND EXISTS (SELECT 1 FROM user_roles WHERE ...))
--      PostgreSQL evaluates this policy on EVERY SELECT against
--      profiles, including the subquery inside "users update own
--      profile": WITH CHECK (status = (SELECT status FROM profiles
--      WHERE id = auth.uid())).  That subquery triggers ALL SELECT
--      policies on profiles again, one of which fires another
--      EXISTS on user_roles — infinite recursion.
--
--   2. "authenticated_read_clinical_roles" on user_roles:
--      Broad "role IN ('Doctor','Clinician')" policy let any
--      authenticated session read those rows, conflicting with the
--      existing per-user policy and causing unexpected behaviour
--      during the upsert in approve().
--
-- SOLUTION
-- --------
-- Drop both bad policies.  Replace the profiles lookup with a
-- SECURITY DEFINER function (is_clinical_staff) that queries
-- user_roles directly without triggering RLS at all — the same
-- safe pattern already used by has_role().
-- useClinicalStaff.ts is updated to call this function via RPC
-- instead of a direct .from("profiles") join.
--
-- The duplicate-key error in user_roles is fixed in users.tsx
-- (upsert with onConflict) — no migration change needed for that.
-- ============================================================

-- ── 1. Drop the recursive policies ──────────────────────────────

DROP POLICY IF EXISTS "authenticated_read_clinical_staff_profiles"
  ON public.profiles;

DROP POLICY IF EXISTS "authenticated_read_clinical_roles"
  ON public.user_roles;

-- ── 2. Safe SECURITY DEFINER function: get_clinical_staff() ─────
--
-- Queries user_roles and profiles WITHOUT going through RLS
-- (SECURITY DEFINER runs as the function owner = postgres).
-- Any authenticated user may call it via supabase.rpc().

CREATE OR REPLACE FUNCTION public.get_clinical_staff()
RETURNS TABLE (id uuid, full_name text, role public.app_role)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    ur.role
  FROM public.profiles  p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE
    p.status  = 'approved'
    AND ur.role IN ('Doctor', 'Clinician')
  ORDER BY p.full_name;
$$;

-- Restrict direct call access; only authenticated sessions may use it
REVOKE ALL ON FUNCTION public.get_clinical_staff() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_clinical_staff() TO authenticated;

-- ── 3. Fix upsert conflict target on user_roles ──────────────────
--
-- The "duplicate key" error happens because approve() did a plain
-- upsert without specifying the conflict target, so Supabase
-- couldn't tell which unique constraint to use for "do nothing".
-- We handle this in users.tsx (onConflict: 'user_id,role').
-- No schema change needed — the constraint already exists.

-- ── 4. (Safety) Ensure user_roles unique constraint exists ───────
-- If somehow the constraint was missing this creates it idempotently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_role_key
      UNIQUE (user_id, role);
  END IF;
END $$;
