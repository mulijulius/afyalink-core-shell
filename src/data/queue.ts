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

// Build relative ISO times so wait-times look live
const minsAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

export const initialQueue: QueueEntry[] = [
  { queueNo: "A012", patientName: "Wanjiku Kamau",  checkInTime: minsAgo(38), triage: "Yellow", doctor: "Dr. Mwangi",   status: "In Consult" },
  { queueNo: "A013", patientName: "Brian Otieno",   checkInTime: minsAgo(32), triage: "Red",    doctor: "Dr. Achieng",  status: "In Consult" },
  { queueNo: "A014", patientName: "Aisha Mohamed",  checkInTime: minsAgo(28), triage: "Green",  doctor: "Dr. Karanja",  status: "Waiting" },
  { queueNo: "A015", patientName: "Joseph Kiprono", checkInTime: minsAgo(22), triage: "Orange", doctor: "Dr. Mwangi",   status: "Waiting" },
  { queueNo: "A016", patientName: "Faith Achieng",  checkInTime: minsAgo(18), triage: "Yellow", doctor: "Dr. Achieng",  status: "Triaged" },
  { queueNo: "A017", patientName: "Samuel Njoroge", checkInTime: minsAgo(13), triage: "Green",  doctor: "Dr. Karanja",  status: "Waiting" },
  { queueNo: "A018", patientName: "Mercy Wairimu",  checkInTime: minsAgo(9),  triage: "Green",  doctor: "Dr. Mwangi",   status: "Waiting" },
  { queueNo: "A019", patientName: "David Mutua",    checkInTime: minsAgo(4),  triage: "Orange", doctor: "Dr. Achieng",  status: "Waiting" },
];

export const DOCTORS = ["Dr. Mwangi", "Dr. Achieng", "Dr. Karanja", "Dr. Wambui"];
