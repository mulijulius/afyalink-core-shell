// ── Triage types & metadata ──────────────────────────────────────

export type Triage = "Red" | "Orange" | "Yellow" | "Green" | "Blue";

export type QueueEntry = {
  queueNo: string;
  patientName: string;
  checkInTime: string; // ISO
  triage: Triage;
  doctor: string;
  status: "Waiting" | "In Consult" | "Triaged";
};

export const TRIAGE_META: Record<
  Triage,
  { label: string; dot: string; badge: string }
> = {
  Red: {
    label: "Immediate",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-700 border-red-500/30",
  },
  Orange: {
    label: "Very Urgent",
    dot: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  },
  Yellow: {
    label: "Urgent",
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-700 border-yellow-500/40",
  },
  Green: {
    label: "Routine",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  Blue: {
    label: "Deceased",
    dot: "bg-blue-600",
    badge: "bg-blue-600/10 text-blue-700 border-blue-600/30",
  },
};

export const TRIAGE_ORDER: Triage[] = ["Red", "Orange", "Yellow", "Green", "Blue"];

// NOTE: The DOCTORS constant has been intentionally removed.
// The "Assigned Doctor" dropdown in CheckInDialog and other portals
// now fetches live Doctor/Clinician profiles directly from Supabase
// via the useClinicalStaff() hook in src/hooks/useClinicalStaff.ts.
