export const dailyVisits = [
  { day: "Mon", visits: 142 },
  { day: "Tue", visits: 168 },
  { day: "Wed", visits: 155 },
  { day: "Thu", visits: 189 },
  { day: "Fri", visits: 204 },
  { day: "Sat", visits: 132 },
  { day: "Sun", visits: 98 },
];

export const departmentBreakdown = [
  { name: "OPD", value: 540, color: "#0057A8" },
  { name: "Inpatient", value: 180, color: "#00A651" },
  { name: "Maternity", value: 96, color: "#E94E77" },
  { name: "Emergency", value: 72, color: "#F59E0B" },
];

export const revenueByMethod = [
  { method: "M-Pesa", amount: 425000 },
  { method: "NHIF", amount: 312000 },
  { method: "Cash", amount: 148000 },
  { method: "Insurance", amount: 96000 },
];

export const topDiagnoses = [
  { dx: "Malaria", count: 142 },
  { dx: "Upper Respiratory Tract Infection", count: 118 },
  { dx: "Hypertension", count: 96 },
  { dx: "Type 2 Diabetes Mellitus", count: 74 },
  { dx: "Pneumonia", count: 68 },
  { dx: "Urinary Tract Infection", count: 55 },
  { dx: "Gastroenteritis", count: 49 },
  { dx: "Asthma", count: 41 },
  { dx: "Tuberculosis", count: 33 },
  { dx: "Anaemia", count: 28 },
];

export type AlertLevel = "Normal" | "Watch" | "Alert";
export type Surveillance = {
  disease: string;
  thisWeek: number;
  lastWeek: number;
  level: AlertLevel;
};

export const surveillance: Surveillance[] = [
  { disease: "Malaria",       thisWeek: 142, lastWeek: 118, level: "Watch"  },
  { disease: "COVID-19",      thisWeek:  18, lastWeek:  22, level: "Normal" },
  { disease: "Cholera",       thisWeek:   7, lastWeek:   2, level: "Alert"  },
  { disease: "Measles",       thisWeek:   3, lastWeek:   4, level: "Normal" },
  { disease: "Dengue Fever",  thisWeek:  11, lastWeek:   5, level: "Watch"  },
  { disease: "Tuberculosis",  thisWeek:  33, lastWeek:  35, level: "Normal" },
];

export type Report = {
  id: string;
  name: string;
  description: string;
  lastGenerated: string;
  action: "Download PDF" | "Submit to DHIS2";
};

export const mohReports: Report[] = [
  { id: "moh711", name: "MOH 711 Monthly Summary", description: "Integrated outpatient & RH summary.", lastGenerated: "2026-05-31", action: "Download PDF" },
  { id: "dhis2",  name: "DHIS2 Data Export",        description: "Aggregated dataset for upload.",     lastGenerated: "2026-06-01", action: "Submit to DHIS2" },
  { id: "nhif",   name: "NHIF Claims Report",       description: "Monthly outpatient & inpatient claims.", lastGenerated: "2026-06-02", action: "Download PDF" },
  { id: "drugs",  name: "Drug Consumption Report",  description: "Pharmacy issues vs receipts.",       lastGenerated: "2026-05-30", action: "Download PDF" },
  { id: "util",   name: "Facility Utilization Report", description: "Bed occupancy, OPD load, ALOS.",  lastGenerated: "2026-05-28", action: "Download PDF" },
];

export const counties = [
  { name: "Nairobi",  cases: 142 },
  { name: "Kisumu",   cases: 88  },
  { name: "Mombasa",  cases: 74  },
  { name: "Nakuru",   cases: 56  },
  { name: "Kiambu",   cases: 49  },
  { name: "Machakos", cases: 41  },
  { name: "Uasin Gishu", cases: 33 },
  { name: "Kakamega", cases: 28 },
];
