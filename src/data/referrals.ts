export const RECEIVING_FACILITIES = [
  "Kenyatta National Hospital (KNH)",
  "Moi Teaching & Referral Hospital",
  "Aga Khan University Hospital",
  "MP Shah Hospital",
  "Nairobi Hospital",
] as const;

export type Urgency = "Routine" | "Urgent" | "Emergency";
export type ReferralStatus = "Pending" | "Received" | "Completed" | "No Feedback";

export type Referral = {
  id: string;
  patient: string;
  nationalId: string;
  sentTo: string;
  dateSent: string;
  urgency: Urgency;
  status: ReferralStatus;
  reason: string;
  outcome?: string;
};

export const sampleReferrals: Referral[] = [
  { id: "REF-3201", patient: "Wanjiku Kamau", nationalId: "29384756", sentTo: "Kenyatta National Hospital (KNH)", dateSent: "2026-05-29", urgency: "Urgent", status: "Received", reason: "Cardiology review for resistant hypertension", outcome: "Patient seen by cardiology team. Echocardiogram scheduled for 2026-06-05." },
  { id: "REF-3202", patient: "Joseph Kiprono", nationalId: "33928174", sentTo: "Moi Teaching & Referral Hospital", dateSent: "2026-05-28", urgency: "Routine", status: "Completed", reason: "Diabetic foot evaluation", outcome: "Wound debridement done. Follow-up in 2 weeks at AfyaLink." },
  { id: "REF-3203", patient: "Brian Otieno", nationalId: "31827465", sentTo: "Aga Khan University Hospital", dateSent: "2026-05-30", urgency: "Emergency", status: "Received", reason: "Severe malaria with complications", outcome: "Admitted to ICU. Currently stable on IV artesunate." },
  { id: "REF-3204", patient: "Aisha Mohamed", nationalId: "27645839", sentTo: "MP Shah Hospital", dateSent: "2026-05-27", urgency: "Routine", status: "Pending", reason: "High-risk antenatal follow-up" },
  { id: "REF-3205", patient: "David Mutua", nationalId: "29103847", sentTo: "Kenyatta National Hospital (KNH)", dateSent: "2026-05-22", urgency: "Urgent", status: "No Feedback", reason: "Suspected typhoid perforation, surgical review" },
  { id: "REF-3206", patient: "Samuel Njoroge", nationalId: "28471920", sentTo: "Nairobi Hospital", dateSent: "2026-05-25", urgency: "Routine", status: "Completed", reason: "Ophthalmology — cataract assessment", outcome: "Cataract surgery scheduled for 2026-06-10." },
  { id: "REF-3207", patient: "Mercy Wairimu", nationalId: "32918475", sentTo: "Aga Khan University Hospital", dateSent: "2026-05-24", urgency: "Routine", status: "Received", reason: "ENT review for recurrent tonsillitis", outcome: "Tonsillectomy planned. Pre-op workup in progress." },
  { id: "REF-3208", patient: "Faith Achieng", nationalId: "30192847", sentTo: "Moi Teaching & Referral Hospital", dateSent: "2026-05-26", urgency: "Urgent", status: "Pending", reason: "Postpartum hemorrhage follow-up" },
];
