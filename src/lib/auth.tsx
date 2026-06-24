import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Role =
  | "Clinician"
  | "Doctor"
  | "Nurse"
  | "Pharmacist"
  | "Lab Technician"
  | "Admin"
  | "Finance Officer";

export type ProfileStatus = "pending" | "approved" | "rejected";

export type AuthUser = {
  id: string;
  email: string;
  role: Role | null;
  status: ProfileStatus;
  name: string;
  initials: string;
  requestedRole: Role | null;
  facility: string;
  department: string | null;
  phone: string | null;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  session: Session | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

// ── Route permissions per role ────────────────────────────────────
//
// BUG FIX (2026-06-24):
//   Clinician was missing "/clinical" from its allowed routes.
//   This caused isRouteAllowed() to return false for any URL that
//   starts with "/clinical/" (e.g. /clinical/$patientId), so clicking
//   the Consult button immediately redirected Clinicians away from the
//   consultation workspace before it could render.
//
//   Clinicians perform the same consultation duties as Doctors
//   (diagnosis, prescriptions, vitals, lab orders, referrals), so
//   "/clinical" must be in their allowed routes.  The RLS policies on
//   all clinical tables (diagnoses, prescriptions, vitals_observations,
//   medical_history, clinical_summaries, referrals) already grant full
//   INSERT/UPDATE access to both 'Clinician' and 'Doctor' roles —
//   only the frontend guard was wrong.

export const ALLOWED_ROUTES: Record<Role, string[]> = {
  // ↓ "/clinical" added — fixes Consult button for Clinicians
  Clinician:        ["/", "/patients", "/opd-queue", "/clinical", "/laboratory", "/referrals", "/settings"],
  Doctor:           ["/", "/patients", "/opd-queue", "/clinical", "/laboratory", "/referrals", "/settings"],
  Nurse:            ["/", "/opd-queue", "/patients", "/settings"],
  Pharmacist:       ["/", "/pharmacy", "/settings"],
  "Lab Technician": ["/", "/laboratory", "/settings"],
  Admin:            ["/", "/patients", "/opd-queue", "/pharmacy", "/laboratory", "/billing", "/referrals", "/analytics", "/users", "/settings"],
  "Finance Officer":["/", "/billing", "/analytics", "/settings"],
};

function initialsFrom(name: string, email: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (sess: Session | null) => {
    if (!sess?.user) { setUser(null); return; }
    const uid = sess.user.id;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    if (!profile) { setUser(null); return; }
    const role = (roles && roles[0]?.role) as Role | undefined;
    const name = profile.full_name || sess.user.email || "User";
    setUser({
      id: uid,
      email: profile.email ?? sess.user.email ?? "",
      role: role ?? null,
      status: profile.status as ProfileStatus,
      name,
      initials: initialsFrom(name, profile.email ?? ""),
      requestedRole: (profile.requested_role as Role | null) ?? null,
      facility: profile.facility ?? "Kapsabet Referral Hospital",
      department: profile.department ?? null,
      phone: profile.phone ?? null,
    });
  };

  useEffect(() => {
    // 1) listener first
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      // defer DB reads off the auth callback
      setTimeout(() => { loadProfile(sess); }, 0);
    });
    // 2) then check existing
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => { await loadProfile(session); };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, session, refresh, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function isRouteAllowed(role: Role, pathname: string) {
  // Special-case deep routes so a prefix match works correctly:
  // /patients/$patientId  → check for "/patients"
  // /clinical/$patientId  → check for "/clinical"
  if (pathname.startsWith("/patients/")) return ALLOWED_ROUTES[role].includes("/patients");
  if (pathname.startsWith("/clinical/")) return ALLOWED_ROUTES[role].includes("/clinical");
  return ALLOWED_ROUTES[role].some(
    (r) => r === pathname || (r !== "/" && pathname.startsWith(r + "/")),
  );
}
