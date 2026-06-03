export type Patient = {
  id: string;
  name: string;
  nationalId: string;
  dob: string; // ISO
  age: number;
  gender: "Male" | "Female";
  phone: string;
  county: string;
  subCounty: string;
  bloodGroup: string;
  allergies: string[];
  nhif?: string;
  nextOfKin: { name: string; phone: string };
  lastVisit: string;
  visits: { date: string; diagnosis: string; clinician: string; notes?: string }[];
  prescriptions: { date: string; drug: string; dose: string; duration: string }[];
  labs: { date: string; test: string; result: string; status: "Normal" | "Abnormal" }[];
  billing: { date: string; item: string; amount: number; status: "Paid" | "Pending" }[];
};

export const KENYA_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta",
  "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru",
  "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
  "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
  "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi",
  "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho",
  "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya",
  "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const patients: Patient[] = [
  {
    id: "p-001",
    name: "Wanjiku Kamau",
    nationalId: "29384756",
    dob: "1989-04-12",
    age: 36,
    gender: "Female",
    phone: "+254 712 345 678",
    county: "Nairobi",
    subCounty: "Westlands",
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    nhif: "NHIF-238471",
    nextOfKin: { name: "Peter Kamau", phone: "+254 722 119 003" },
    lastVisit: "2026-05-28",
    visits: [
      { date: "2026-05-28", diagnosis: "Hypertension follow-up", clinician: "Dr. Mwangi" },
      { date: "2026-03-14", diagnosis: "Upper Respiratory Infection", clinician: "Dr. Achieng" },
      { date: "2025-11-02", diagnosis: "Routine check-up", clinician: "Dr. Mwangi" },
    ],
    prescriptions: [
      { date: "2026-05-28", drug: "Amlodipine", dose: "5mg", duration: "30 days" },
      { date: "2026-03-14", drug: "Amoxicillin", dose: "500mg", duration: "7 days" },
    ],
    labs: [
      { date: "2026-05-28", test: "Blood Pressure", result: "138/88", status: "Abnormal" },
      { date: "2026-05-28", test: "Fasting Glucose", result: "5.2 mmol/L", status: "Normal" },
    ],
    billing: [
      { date: "2026-05-28", item: "Consultation", amount: 1500, status: "Paid" },
      { date: "2026-05-28", item: "Pharmacy", amount: 850, status: "Paid" },
    ],
  },
  {
    id: "p-002",
    name: "Brian Otieno",
    nationalId: "31827465",
    dob: "1995-08-23",
    age: 30,
    gender: "Male",
    phone: "+254 733 902 145",
    county: "Kisumu",
    subCounty: "Kisumu Central",
    bloodGroup: "A+",
    allergies: [],
    nhif: "NHIF-902817",
    nextOfKin: { name: "Mary Otieno", phone: "+254 720 884 211" },
    lastVisit: "2026-05-30",
    visits: [
      { date: "2026-05-30", diagnosis: "Malaria", clinician: "Dr. Mwangi" },
      { date: "2025-12-09", diagnosis: "Sprained ankle", clinician: "Dr. Karanja" },
    ],
    prescriptions: [
      { date: "2026-05-30", drug: "Artemether-Lumefantrine", dose: "20/120mg", duration: "3 days" },
    ],
    labs: [
      { date: "2026-05-30", test: "Malaria Smear", result: "P. falciparum +", status: "Abnormal" },
    ],
    billing: [
      { date: "2026-05-30", item: "Consultation", amount: 1500, status: "Paid" },
      { date: "2026-05-30", item: "Lab", amount: 600, status: "Paid" },
    ],
  },
  {
    id: "p-003",
    name: "Aisha Mohamed",
    nationalId: "27645839",
    dob: "1992-01-17",
    age: 34,
    gender: "Female",
    phone: "+254 701 224 980",
    county: "Mombasa",
    subCounty: "Mvita",
    bloodGroup: "B+",
    allergies: ["Sulfa drugs", "Peanuts"],
    nextOfKin: { name: "Hassan Mohamed", phone: "+254 711 008 332" },
    lastVisit: "2026-05-29",
    visits: [
      { date: "2026-05-29", diagnosis: "Antenatal visit", clinician: "Dr. Achieng" },
      { date: "2026-04-20", diagnosis: "Antenatal visit", clinician: "Dr. Achieng" },
    ],
    prescriptions: [
      { date: "2026-05-29", drug: "Folic Acid", dose: "5mg", duration: "60 days" },
    ],
    labs: [
      { date: "2026-05-29", test: "Hemoglobin", result: "11.4 g/dL", status: "Normal" },
    ],
    billing: [{ date: "2026-05-29", item: "ANC visit", amount: 1200, status: "Paid" }],
  },
  {
    id: "p-004",
    name: "Joseph Kiprono",
    nationalId: "33928174",
    dob: "1978-11-30",
    age: 47,
    gender: "Male",
    phone: "+254 728 561 042",
    county: "Uasin Gishu",
    subCounty: "Eldoret East",
    bloodGroup: "O-",
    allergies: [],
    nhif: "NHIF-441922",
    nextOfKin: { name: "Rebecca Kiprono", phone: "+254 720 119 884" },
    lastVisit: "2026-05-27",
    visits: [
      { date: "2026-05-27", diagnosis: "Type 2 Diabetes review", clinician: "Dr. Mwangi" },
    ],
    prescriptions: [
      { date: "2026-05-27", drug: "Metformin", dose: "500mg BD", duration: "30 days" },
    ],
    labs: [
      { date: "2026-05-27", test: "HbA1c", result: "7.8%", status: "Abnormal" },
    ],
    billing: [{ date: "2026-05-27", item: "Consultation", amount: 1500, status: "Pending" }],
  },
  {
    id: "p-005",
    name: "Faith Achieng",
    nationalId: "30192847",
    dob: "1987-06-05",
    age: 38,
    gender: "Female",
    phone: "+254 715 802 661",
    county: "Siaya",
    subCounty: "Bondo",
    bloodGroup: "AB+",
    allergies: ["Aspirin"],
    nextOfKin: { name: "Michael Ouma", phone: "+254 722 660 119" },
    lastVisit: "2026-05-26",
    visits: [
      { date: "2026-05-26", diagnosis: "Postnatal review", clinician: "Dr. Achieng" },
    ],
    prescriptions: [
      { date: "2026-05-26", drug: "Iron + Folate", dose: "1 tab OD", duration: "60 days" },
    ],
    labs: [],
    billing: [{ date: "2026-05-26", item: "PNC visit", amount: 1000, status: "Paid" }],
  },
  {
    id: "p-006",
    name: "Samuel Njoroge",
    nationalId: "28471920",
    dob: "1965-02-28",
    age: 60,
    gender: "Male",
    phone: "+254 720 110 487",
    county: "Kiambu",
    subCounty: "Thika",
    bloodGroup: "A-",
    allergies: [],
    nhif: "NHIF-771203",
    nextOfKin: { name: "Grace Njoroge", phone: "+254 711 449 002" },
    lastVisit: "2026-05-25",
    visits: [
      { date: "2026-05-25", diagnosis: "Hypertension", clinician: "Dr. Karanja" },
    ],
    prescriptions: [
      { date: "2026-05-25", drug: "Losartan", dose: "50mg", duration: "30 days" },
    ],
    labs: [],
    billing: [{ date: "2026-05-25", item: "Consultation", amount: 1500, status: "Paid" }],
  },
  {
    id: "p-007",
    name: "Mercy Wairimu",
    nationalId: "32918475",
    dob: "2001-09-14",
    age: 24,
    gender: "Female",
    phone: "+254 717 446 003",
    county: "Nakuru",
    subCounty: "Naivasha",
    bloodGroup: "O+",
    allergies: [],
    nextOfKin: { name: "Jane Wairimu", phone: "+254 728 002 491" },
    lastVisit: "2026-05-24",
    visits: [{ date: "2026-05-24", diagnosis: "Tonsillitis", clinician: "Dr. Mwangi" }],
    prescriptions: [
      { date: "2026-05-24", drug: "Amoxicillin", dose: "500mg TDS", duration: "5 days" },
    ],
    labs: [],
    billing: [{ date: "2026-05-24", item: "Pharmacy", amount: 450, status: "Paid" }],
  },
  {
    id: "p-008",
    name: "David Mutua",
    nationalId: "29103847",
    dob: "1990-12-03",
    age: 35,
    gender: "Male",
    phone: "+254 723 558 109",
    county: "Machakos",
    subCounty: "Athi River",
    bloodGroup: "B-",
    allergies: ["Latex"],
    nhif: "NHIF-553218",
    nextOfKin: { name: "Esther Mutua", phone: "+254 720 884 117" },
    lastVisit: "2026-05-22",
    visits: [
      { date: "2026-05-22", diagnosis: "Typhoid", clinician: "Dr. Karanja" },
    ],
    prescriptions: [
      { date: "2026-05-22", drug: "Ciprofloxacin", dose: "500mg BD", duration: "10 days" },
    ],
    labs: [
      { date: "2026-05-22", test: "Widal test", result: "Positive", status: "Abnormal" },
    ],
    billing: [{ date: "2026-05-22", item: "Lab + Pharmacy", amount: 2100, status: "Pending" }],
  },
];

export function getPatient(id: string) {
  return patients.find((p) => p.id === id);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
