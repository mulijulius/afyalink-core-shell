export type PaymentMethod = "M-Pesa" | "NHIF" | "Cash" | "Insurance";

export type Transaction = {
  receipt: string;
  patient: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  status: "Paid" | "Pending" | "Failed";
};

export type Claim = {
  claimId: string;
  patient: string;
  visitDate: string;
  amount: number;
  submitted: string;
  status: "Submitted" | "Approved" | "Rejected";
  rejectionReason?: string;
};

export const transactions: Transaction[] = [
  { receipt: "RCP-10241", patient: "Wanjiku Kamau",   date: "2026-06-03", amount: 2350, method: "M-Pesa",   status: "Paid"    },
  { receipt: "RCP-10240", patient: "Brian Otieno",    date: "2026-06-03", amount: 2100, method: "NHIF",     status: "Paid"    },
  { receipt: "RCP-10239", patient: "Aisha Mohamed",   date: "2026-06-02", amount: 1200, method: "Cash",     status: "Paid"    },
  { receipt: "RCP-10238", patient: "Joseph Kiprono",  date: "2026-06-02", amount: 3400, method: "NHIF",     status: "Pending" },
  { receipt: "RCP-10237", patient: "Faith Achieng",   date: "2026-06-02", amount: 1000, method: "M-Pesa",   status: "Paid"    },
  { receipt: "RCP-10236", patient: "Samuel Njoroge",  date: "2026-06-01", amount: 1500, method: "Insurance",status: "Paid"    },
  { receipt: "RCP-10235", patient: "Mercy Wairimu",   date: "2026-06-01", amount:  450, method: "Cash",     status: "Paid"    },
  { receipt: "RCP-10234", patient: "David Mutua",     date: "2026-05-31", amount: 2100, method: "M-Pesa",   status: "Failed"  },
  { receipt: "RCP-10233", patient: "Peter Kariuki",   date: "2026-05-31", amount: 5600, method: "NHIF",     status: "Paid"    },
  { receipt: "RCP-10232", patient: "Grace Atieno",    date: "2026-05-30", amount: 1800, method: "M-Pesa",   status: "Paid"    },
];

export const claims: Claim[] = [
  { claimId: "CLM-3018", patient: "Brian Otieno",   visitDate: "2026-06-03", amount: 2100, submitted: "2026-06-03", status: "Submitted" },
  { claimId: "CLM-3017", patient: "Joseph Kiprono", visitDate: "2026-06-02", amount: 3400, submitted: "2026-06-02", status: "Submitted" },
  { claimId: "CLM-3016", patient: "Peter Kariuki",  visitDate: "2026-05-31", amount: 5600, submitted: "2026-05-31", status: "Approved" },
  { claimId: "CLM-3015", patient: "Naomi Wafula",   visitDate: "2026-05-30", amount: 1800, submitted: "2026-05-30", status: "Approved" },
  {
    claimId: "CLM-3014",
    patient: "John Maina",
    visitDate: "2026-05-29",
    amount: 4200,
    submitted: "2026-05-29",
    status: "Rejected",
    rejectionReason: "NHIF cover lapsed — last contribution March 2026.",
  },
  { claimId: "CLM-3013", patient: "Linet Nyambura", visitDate: "2026-05-28", amount: 2750, submitted: "2026-05-28", status: "Approved" },
  {
    claimId: "CLM-3012",
    patient: "Hassan Ali",
    visitDate: "2026-05-27",
    amount: 1500,
    submitted: "2026-05-27",
    status: "Rejected",
    rejectionReason: "Procedure code missing from outpatient claim form.",
  },
];

export type BillItem = {
  id: string;
  service: string;
  qty: number;
  unitCost: number;
};

export const defaultBillItems: BillItem[] = [
  { id: "i1", service: "Consultation Fee",  qty: 1, unitCost: 1500 },
  { id: "i2", service: "Malaria RDT",       qty: 1, unitCost: 350  },
  { id: "i3", service: "Amoxicillin 500mg", qty: 10, unitCost: 30  },
  { id: "i4", service: "IV Fluids (NS 500ml)", qty: 2, unitCost: 250 },
];

export function ksh(n: number) {
  return `KES ${n.toLocaleString()}`;
}
