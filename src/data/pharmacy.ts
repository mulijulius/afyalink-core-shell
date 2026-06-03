export type Drug = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  expiry: string; // ISO date
  supplier: string;
};

export const DRUG_CATEGORIES = [
  "Antibiotic",
  "Antimalarial",
  "Antihypertensive",
  "Antidiabetic",
  "Analgesic",
  "ORS / Fluids",
  "Antifungal",
  "Antihistamine",
  "Vitamin / Supplement",
  "Other",
];

export const initialDrugs: Drug[] = [
  { id: "d1",  name: "Amoxicillin 500mg",                 category: "Antibiotic",        stock: 18,  unit: "strips", reorderLevel: 50,  expiry: "2027-03-15", supplier: "KEMSA" },
  { id: "d2",  name: "Artemether-Lumefantrine 20/120mg",  category: "Antimalarial",      stock: 24,  unit: "packs",  reorderLevel: 60,  expiry: "2026-07-20", supplier: "KEMSA" },
  { id: "d3",  name: "Metformin 500mg",                   category: "Antidiabetic",      stock: 15,  unit: "strips", reorderLevel: 40,  expiry: "2026-08-10", supplier: "Cosmos Pharma" },
  { id: "d4",  name: "Lisinopril 10mg",                   category: "Antihypertensive",  stock: 220, unit: "tabs",   reorderLevel: 80,  expiry: "2027-01-30", supplier: "Universal Corp" },
  { id: "d5",  name: "ORS Sachets",                       category: "ORS / Fluids",      stock: 480, unit: "sachets",reorderLevel: 150, expiry: "2027-11-05", supplier: "KEMSA" },
  { id: "d6",  name: "Paracetamol 500mg",                 category: "Analgesic",         stock: 42,  unit: "tabs",   reorderLevel: 200, expiry: "2026-12-12", supplier: "Dawa Limited" },
  { id: "d7",  name: "Amlodipine 5mg",                    category: "Antihypertensive",  stock: 0,   unit: "strips", reorderLevel: 30,  expiry: "2026-09-22", supplier: "KEMSA" },
  { id: "d8",  name: "Ciprofloxacin 500mg",               category: "Antibiotic",        stock: 95,  unit: "tabs",   reorderLevel: 50,  expiry: "2026-08-25", supplier: "Cosmos Pharma" },
  { id: "d9",  name: "Salbutamol Inhaler",                category: "Other",             stock: 64,  unit: "units",  reorderLevel: 20,  expiry: "2027-05-18", supplier: "Beta Healthcare" },
  { id: "d10", name: "Ferrous Sulphate 200mg",            category: "Vitamin / Supplement", stock: 310, unit: "tabs", reorderLevel: 100, expiry: "2028-02-14", supplier: "KEMSA" },
];

export type Prescription = {
  id: string;
  drug: string;
  dose: string;
  quantity: string;
};

export type PrescriptionVisit = {
  visitId: string;
  patient: string;
  nationalId: string;
  date: string;
  clinician: string;
  prescriptions: Prescription[];
};

export const prescriptionVisits: PrescriptionVisit[] = [
  {
    visitId: "V-2025",
    patient: "Wanjiku Kamau",
    nationalId: "29384756",
    date: "2026-06-03",
    clinician: "Dr. Mwangi",
    prescriptions: [
      { id: "rx1", drug: "Amlodipine 5mg", dose: "5mg OD", quantity: "30 tabs" },
      { id: "rx2", drug: "Paracetamol 500mg", dose: "1g PRN", quantity: "20 tabs" },
    ],
  },
  {
    visitId: "V-2026",
    patient: "Brian Otieno",
    nationalId: "31827465",
    date: "2026-06-03",
    clinician: "Dr. Achieng",
    prescriptions: [
      { id: "rx3", drug: "Artemether-Lumefantrine 20/120mg", dose: "4 tabs BD", quantity: "1 pack" },
    ],
  },
  {
    visitId: "V-2027",
    patient: "Joseph Kiprono",
    nationalId: "33928174",
    date: "2026-06-02",
    clinician: "Dr. Mwangi",
    prescriptions: [
      { id: "rx4", drug: "Metformin 500mg", dose: "500mg BD", quantity: "60 tabs" },
      { id: "rx5", drug: "Lisinopril 10mg", dose: "10mg OD", quantity: "30 tabs" },
    ],
  },
];

export function statusFor(d: Drug): "In Stock" | "Low Stock" | "Out of Stock" {
  if (d.stock === 0) return "Out of Stock";
  if (d.stock < d.reorderLevel) return "Low Stock";
  return "In Stock";
}

export function daysUntil(iso: string) {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
}
