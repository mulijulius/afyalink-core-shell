import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role =
  | "Clinician"
  | "Nurse"
  | "Pharmacist"
  | "Lab Technician"
  | "Admin"
  | "Finance Officer";

export type AuthUser = {
  email: string;
  role: Role;
  name: string;
  initials: string;
};

type AuthCtx = {
  user: AuthUser | null;
  email: string | null;
  setEmail: (e: string | null) => void;
  setRole: (r: Role) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

const ROLE_NAMES: Record<Role, { name: string; initials: string }> = {
  Clinician:        { name: "Dr. Mwangi",       initials: "DM" },
  Nurse:            { name: "Nurse Akinyi",     initials: "NA" },
  Pharmacist:       { name: "Brian Otieno",     initials: "BO" },
  "Lab Technician": { name: "Faith Achieng",    initials: "FA" },
  Admin:            { name: "Admin Kamau",      initials: "AK" },
  "Finance Officer":{ name: "Mercy Wairimu",    initials: "MW" },
};

export const ALLOWED_ROUTES: Record<Role, string[]> = {
  Clinician:        ["/", "/patients", "/opd-queue", "/laboratory", "/referrals", "/settings"],
  Nurse:            ["/", "/opd-queue", "/patients", "/settings"],
  Pharmacist:       ["/", "/pharmacy", "/settings"],
  "Lab Technician": ["/", "/laboratory", "/settings"],
  Admin:            ["/", "/patients", "/opd-queue", "/pharmacy", "/laboratory", "/billing", "/referrals", "/analytics", "/settings"],
  "Finance Officer":["/", "/billing", "/analytics", "/settings"],
};

const STORAGE_KEY = "afyalink-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmailState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {/* noop */}
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        email,
        setEmail: setEmailState,
        setRole: (role) => {
          const profile = ROLE_NAMES[role];
          persist({ email: email ?? "user@kch.go.ke", role, ...profile });
        },
        logout: () => {
          setEmailState(null);
          persist(null);
        },
      }}
    >
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
  // Always allow patient detail pages for clinicians/nurses/admins
  if (pathname.startsWith("/patients/")) {
    return ALLOWED_ROUTES[role].includes("/patients");
  }
  return ALLOWED_ROUTES[role].some(
    (r) => r === pathname || (r !== "/" && pathname.startsWith(r + "/")),
  );
}
