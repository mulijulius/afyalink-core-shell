export const LAB_TESTS = [
  "Full Blood Count",
  "Malaria RDT",
  "Blood Glucose",
  "Urinalysis",
  "HIV Rapid Test",
  "Widal Test",
  "Lipid Profile",
  "Liver Function Tests",
  "Chest X-Ray",
  "Sputum AFB",
] as const;

export type LabPriority = "Routine" | "Urgent" | "STAT";
export type OrderStatus = "Pending" | "Collected" | "Processing" | "Completed";
export type SampleStage = "Collected" | "Received by Lab" | "Processing" | "Results Ready";

export type LabOrder = {
  id: string;
  patientName: string;
  nationalId: string;
  tests: string[];
  orderedBy: string;
  time: string;
  priority: LabPriority;
  status: OrderStatus;
};

export type LabResult = {
  orderId: string;
  patient: string;
  test: string;
  result: string;
  range: string;
  flag: "High" | "Low" | "Normal";
  verifiedBy: string;
  time: string;
  critical?: boolean;
};

export type SampleTrack = {
  sampleId: string;
  patient: string;
  test: string;
  stage: SampleStage;
  updated: string;
};

export const initialOrders: LabOrder[] = [
  { id: "LAB-2041", patientName: "Wanjiku Kamau", nationalId: "29384756", tests: ["Full Blood Count", "Lipid Profile"], orderedBy: "Dr. Mwangi", time: "08:42", priority: "Routine", status: "Processing" },
  { id: "LAB-2042", patientName: "Brian Otieno", nationalId: "31827465", tests: ["Malaria RDT"], orderedBy: "Dr. Mwangi", time: "09:05", priority: "Urgent", status: "Completed" },
  { id: "LAB-2043", patientName: "Joseph Kiprono", nationalId: "33928174", tests: ["Blood Glucose", "Liver Function Tests"], orderedBy: "Dr. Mwangi", time: "09:18", priority: "STAT", status: "Completed" },
  { id: "LAB-2044", patientName: "Aisha Mohamed", nationalId: "27645839", tests: ["Urinalysis", "HIV Rapid Test"], orderedBy: "Dr. Achieng", time: "09:34", priority: "Routine", status: "Collected" },
  { id: "LAB-2045", patientName: "David Mutua", nationalId: "29103847", tests: ["Widal Test"], orderedBy: "Dr. Karanja", time: "09:55", priority: "Urgent", status: "Pending" },
  { id: "LAB-2046", patientName: "Mercy Wairimu", nationalId: "32918475", tests: ["Chest X-Ray", "Sputum AFB"], orderedBy: "Dr. Mwangi", time: "10:12", priority: "Routine", status: "Processing" },
];

export const initialResults: LabResult[] = [
  { orderId: "LAB-2042", patient: "Brian Otieno", test: "Malaria RDT", result: "P. falciparum +", range: "Negative", flag: "High", verifiedBy: "Lab. Otieno", time: "09:40" },
  { orderId: "LAB-2043", patient: "Joseph Kiprono", test: "Blood Glucose (Fasting)", result: "22.4 mmol/L", range: "3.9 – 6.1 mmol/L", flag: "High", verifiedBy: "Lab. Otieno", time: "09:55", critical: true },
  { orderId: "LAB-2043", patient: "Joseph Kiprono", test: "ALT (Liver)", result: "48 U/L", range: "7 – 56 U/L", flag: "Normal", verifiedBy: "Lab. Otieno", time: "09:58" },
  { orderId: "LAB-2041", patient: "Wanjiku Kamau", test: "Hemoglobin", result: "9.2 g/dL", range: "12.0 – 16.0 g/dL", flag: "Low", verifiedBy: "Lab. Njeri", time: "10:02" },
  { orderId: "LAB-2041", patient: "Wanjiku Kamau", test: "Total Cholesterol", result: "6.8 mmol/L", range: "< 5.2 mmol/L", flag: "High", verifiedBy: "Lab. Njeri", time: "10:05" },
  { orderId: "LAB-2041", patient: "Wanjiku Kamau", test: "WBC Count", result: "7.1 x10⁹/L", range: "4.0 – 11.0 x10⁹/L", flag: "Normal", verifiedBy: "Lab. Njeri", time: "10:06" },
];

export const sampleTracks: SampleTrack[] = [
  { sampleId: "SMP-9821", patient: "Wanjiku Kamau", test: "Full Blood Count", stage: "Processing", updated: "09:48" },
  { sampleId: "SMP-9822", patient: "Brian Otieno", test: "Malaria RDT", stage: "Results Ready", updated: "09:40" },
  { sampleId: "SMP-9823", patient: "Joseph Kiprono", test: "Blood Glucose", stage: "Results Ready", updated: "09:55" },
  { sampleId: "SMP-9824", patient: "Aisha Mohamed", test: "Urinalysis", stage: "Received by Lab", updated: "09:50" },
  { sampleId: "SMP-9825", patient: "David Mutua", test: "Widal Test", stage: "Collected", updated: "10:01" },
  { sampleId: "SMP-9826", patient: "Mercy Wairimu", test: "Chest X-Ray", stage: "Processing", updated: "10:15" },
];

export const SAMPLE_STAGES: SampleStage[] = ["Collected", "Received by Lab", "Processing", "Results Ready"];
