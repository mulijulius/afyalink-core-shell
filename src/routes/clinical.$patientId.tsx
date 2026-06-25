import { useEffect, useState, useCallback } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, Phone, MapPin, IdCard, Droplet, User, Stethoscope,
  Activity, Pill, FlaskConical, Share2, FileText,
  Plus, AlertTriangle, History, NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";

// ── Types ──────────────────────────────────────────────────────────

type Gender = Database["public"]["Enums"]["gender"];
type LabPriority = Database["public"]["Enums"]["lab_priority"];
type ResultFlag = Database["public"]["Enums"]["result_flag"];

type PatientRecord = {
  id: string;
  full_name: string;
  national_id: string;
  dob: string;
  gender: Gender;
  phone: string | null;
  county: string | null;
  sub_county: string | null;
  blood_group: string | null;
  allergies: string[];
  nhif_no: string | null;
  nok_name: string | null;
  nok_phone: string | null;
};

type VitalsRow = {
  id: string;
  recorded_at: string;
  recorded_by_name: string | null;
  temperature_c: number | null;
  pulse_bpm: number | null;
  resp_rate: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  spo2_percent: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  chief_complaint: string | null;
  symptoms: string[];
  signs: string | null;
  notes: string | null;
};

type DiagnosisRow = {
  id: string;
  diagnosis: string;
  diagnosis_type: string;
  icd10_code: string | null;
  notes: string | null;
  diagnosed_by_name: string | null;
  created_at: string;
};

type PrescriptionRow = {
  id: string;
  drug_name: string;
  dose: string;
  quantity: string;
  prescribed_by_name: string | null;
  dispensed: boolean;
  created_at: string;
};

type MedicalHistoryRow = {
  id: string;
  category: string;
  description: string;
  onset_date: string | null;
  status: string;
  recorded_by_name: string | null;
  created_at: string;
};

type LabOrderRow = {
  id: string;
  order_no: string;
  tests: string[];
  priority: LabPriority;
  status: string;
  created_at: string;
};

type LabResultRow = {
  id: string;
  order_id: string;
  test_name: string;
  result: string;
  reference_range: string | null;
  flag: ResultFlag;
  is_critical: boolean;
  verified_by_name: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
};

type ReferralRow = {
  id: string;
  ref_no: string;
  sent_to: string;
  urgency: string;
  status: string;
  reason: string;
  date_sent: string;
};

type SummaryRow = {
  id: string;
  summary: string;
  authored_by_name: string | null;
  created_at: string;
  updated_at: string;
};

type DrugOption = { id: string; name: string; unit: string; stock: number };

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Fatigue", "Nausea", "Vomiting",
  "Diarrhea", "Abdominal pain", "Chest pain", "Shortness of breath",
  "Dizziness", "Joint pain", "Rash", "Sore throat",
] as const;

const LAB_TESTS = [
  "Full Blood Count", "Malaria RDT", "Blood Glucose", "Urinalysis",
  "HIV Rapid Test", "Widal Test", "Lipid Profile", "Liver Function Tests",
  "Chest X-Ray", "Sputum AFB",
] as const;

const RECEIVING_FACILITIES = [
  "Kenyatta National Hospital (KNH)",
  "Moi Teaching & Referral Hospital",
  "Aga Khan University Hospital",
  "MP Shah Hospital",
  "Nairobi Hospital",
] as const;

const HISTORY_CATEGORIES = ["Condition", "Surgery", "Family", "Social", "Immunization", "Other"] as const;

function calculateAge(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  return Math.floor((Date.now() - birth.getTime()) / 31557600000);
}

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

const flagClass = (f: ResultFlag) =>
  f === "High" ? "bg-red-100 text-red-700 border-red-200"
  : f === "Low" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-emerald-100 text-emerald-700 border-emerald-200";

const urgencyClass = (u: string) =>
  u === "Emergency" ? "bg-red-100 text-red-700 border-red-200"
  : u === "Urgent" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-slate-100 text-slate-700 border-slate-200";

export const Route = createFileRoute("/clinical/$patientId")({
  head: ({ params }) => ({
    meta: [{ title: `Consultation · ${params.patientId} · AfyaLink HMS` }],
  }),
  loader: async ({ params }) => {
    const { data: patient, error } = await supabase
      .from("patients")
      .select(
        "id, full_name, national_id, dob, gender, phone, county, sub_county, blood_group, allergies, nhif_no, nok_name, nok_phone",
      )
      .eq("id", params.patientId)
      .maybeSingle();

    if (error || !patient) throw notFound();

    return { patient: patient as PatientRecord };
  },
  component: ConsultationWorkspace,
  notFoundComponent: () => (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Patient not found</h2>
      <Button asChild variant="outline">
        <Link to="/clinical">Back to Clinical Workspace</Link>
      </Button>
    </div>
  ),
});

function ConsultationWorkspace() {
  const { patient } = Route.useLoaderData() as { patient: PatientRecord };

  const [vitals, setVitals] = useState<VitalsRow[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisRow[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [history, setHistory] = useState<MedicalHistoryRow[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderRow[]>([]);
  const [labResults, setLabResults] = useState<LabResultRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [drugs, setDrugs] = useState<DrugOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [
      vitalsRes, dxRes, rxRes, histRes, labOrderRes, referralRes, summaryRes, drugsRes,
    ] = await Promise.all([
      supabase.from("vitals_observations")
        .select("id, recorded_at, recorded_by_name, temperature_c, pulse_bpm, resp_rate, bp_systolic, bp_diastolic, spo2_percent, weight_kg, height_cm, chief_complaint, symptoms, signs, notes")
        .eq("patient_id", patient.id)
        .order("recorded_at", { ascending: false }),
      supabase.from("diagnoses")
        .select("id, diagnosis, diagnosis_type, icd10_code, notes, diagnosed_by_name, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
      supabase.from("prescriptions")
        .select("id, drug_name, dose, quantity, prescribed_by_name, dispensed, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
      supabase.from("medical_history")
        .select("id, category, description, onset_date, status, recorded_by_name, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
      supabase.from("lab_orders")
        .select("id, order_no, tests, priority, status, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
      supabase.from("referrals")
        .select("id, ref_no, sent_to, urgency, status, reason, date_sent")
        .eq("patient_id", patient.id)
        .order("date_sent", { ascending: false }),
      supabase.from("clinical_summaries")
        .select("id, summary, authored_by_name, created_at, updated_at")
        .eq("patient_id", patient.id)
        .order("updated_at", { ascending: false }),
      supabase.from("pharmacy_drugs").select("id, name, unit, stock").order("name"),
    ]);

    setVitals(vitalsRes.data ?? []);
    setDiagnoses(dxRes.data ?? []);
    setPrescriptions(rxRes.data ?? []);
    setHistory(histRes.data ?? []);
    setLabOrders(labOrderRes.data ?? []);
    setReferrals(referralRes.data ?? []);
    setSummaries(summaryRes.data ?? []);
    setDrugs(drugsRes.data ?? []);

    const orderIds = (labOrderRes.data ?? []).map((o) => o.id);
    if (orderIds.length > 0) {
      const { data: results, error } = await supabase
        .from("lab_results")
        .select("id, order_id, test_name, result, reference_range, flag, is_critical, verified_by_name, image_url, notes, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });
      if (error) console.error("Failed to load lab results:", error.message);
      setLabResults(results ?? []);
    } else {
      setLabResults([]);
    }

    setLoading(false);
  }, [patient.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const age = calculateAge(patient.dob);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/clinical">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Clinical Workspace
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
              {initials(patient.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{patient.full_name}</h1>
              <Button asChild size="sm" variant="outline" className="ml-auto">
                <Link to="/patients/$patientId" params={{ patientId: patient.id }}>
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Full Patient Record
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{age} yrs · {patient.gender}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IdCard className="h-4 w-4" />
                <span className="font-mono">{patient.national_id}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Droplet className="h-4 w-4" />
                <Badge variant="outline" className="ml-1 border-primary/30 bg-primary/5 text-primary">
                  {patient.blood_group ?? "Unknown"}
                </Badge>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {patient.phone ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {patient.sub_county ?? "—"}, {patient.county ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                NoK: {patient.nok_name ?? "Unknown"} ({patient.nok_phone ?? "Unknown"})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Allergies:
              </span>
              {patient.allergies.length === 0 ? (
                <Badge variant="outline" className="font-normal">None recorded</Badge>
              ) : (
                patient.allergies.map((a) => (
                  <Badge key={a} variant="outline" className="border-destructive/30 bg-destructive/10 font-medium text-destructive">
                    {a}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vitals">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="vitals"><Activity className="mr-1.5 h-4 w-4" />Vitals & Symptoms</TabsTrigger>
          <TabsTrigger value="diagnosis"><Stethoscope className="mr-1.5 h-4 w-4" />Diagnosis</TabsTrigger>
          <TabsTrigger value="prescriptions"><Pill className="mr-1.5 h-4 w-4" />Prescriptions</TabsTrigger>
          <TabsTrigger value="labs"><FlaskConical className="mr-1.5 h-4 w-4" />Lab Orders & Results</TabsTrigger>
          <TabsTrigger value="referrals"><Share2 className="mr-1.5 h-4 w-4" />Referrals</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />Medical History</TabsTrigger>
          <TabsTrigger value="summary"><NotebookPen className="mr-1.5 h-4 w-4" />Medical Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="mt-4">
          <VitalsTab patientId={patient.id} vitals={vitals} loading={loading} onSaved={loadAll} />
        </TabsContent>

        <TabsContent value="diagnosis" className="mt-4">
          <DiagnosisTab patientId={patient.id} diagnoses={diagnoses} loading={loading} onSaved={loadAll} />
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-4">
          <PrescriptionsTab
            patientId={patient.id}
            patientName={patient.full_name}
            prescriptions={prescriptions}
            drugs={drugs}
            loading={loading}
            onSaved={loadAll}
          />
        </TabsContent>

        <TabsContent value="labs" className="mt-4">
          <LabsTab
            patientId={patient.id}
            patientName={patient.full_name}
            nationalId={patient.national_id}
            orders={labOrders}
            results={labResults}
            loading={loading}
            onSaved={loadAll}
          />
        </TabsContent>

        <TabsContent value="referrals" className="mt-4">
          <ReferralsTab
            patientId={patient.id}
            patientName={patient.full_name}
            nationalId={patient.national_id}
            referrals={referrals}
            loading={loading}
            onSaved={loadAll}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab patientId={patient.id} history={history} loading={loading} onSaved={loadAll} />
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <SummaryTab
            patientId={patient.id}
            summaries={summaries}
            loading={loading}
            onSaved={loadAll}
            patient={patient}
            vitals={vitals}
            diagnoses={diagnoses}
            prescriptions={prescriptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Vitals & Symptoms ────────────────────────────────────────────

function VitalsTab({
  patientId, vitals, loading, onSaved,
}: {
  patientId: string; vitals: VitalsRow[]; loading: boolean; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [signs, setSigns] = useState("");
  const [notes, setNotes] = useState("");
  const [temp, setTemp] = useState("");
  const [pulse, setPulse] = useState("");
  const [resp, setResp] = useState("");
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setChiefComplaint(""); setSymptoms([]); setSigns(""); setNotes("");
    setTemp(""); setPulse(""); setResp(""); setBpSys(""); setBpDia("");
    setSpo2(""); setWeight(""); setHeight("");
  };

  const submit = async () => {
    if (!chiefComplaint.trim() && symptoms.length === 0) {
      toast.error("Record at least a chief complaint or symptom");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("vitals_observations").insert({
      patient_id: patientId,
      recorded_by: user?.id ?? null,
      recorded_by_name: user?.name ?? null,
      temperature_c: temp ? Number(temp) : null,
      pulse_bpm: pulse ? Number(pulse) : null,
      resp_rate: resp ? Number(resp) : null,
      bp_systolic: bpSys ? Number(bpSys) : null,
      bp_diastolic: bpDia ? Number(bpDia) : null,
      spo2_percent: spo2 ? Number(spo2) : null,
      weight_kg: weight ? Number(weight) : null,
      height_cm: height ? Number(height) : null,
      chief_complaint: chiefComplaint || null,
      symptoms,
      signs: signs || null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      console.error("Failed to save vitals:", error);
      toast.error("Failed to save vitals & symptoms");
      return;
    }
    toast.success("Vitals & symptoms recorded");
    reset();
    setOpen(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{vitals.length} recorded observation(s)</p>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1.5 h-4 w-4" /> {open ? "Close" : "Record Vitals & Symptoms"}
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Observation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Chief Complaint</Label>
              <Textarea rows={2} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Fever and headache for 3 days" />
            </div>

            <div className="space-y-2">
              <Label>Symptoms</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
                {COMMON_SYMPTOMS.map((s) => {
                  const checked = symptoms.includes(s);
                  return (
                    <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={checked} onCheckedChange={(v) =>
                        setSymptoms((prev) => v ? [...prev, s] : prev.filter((x) => x !== s))} />
                      {s}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Signs on Examination</Label>
              <Textarea rows={2} value={signs} onChange={(e) => setSigns(e.target.value)}
                placeholder="e.g. Pale conjunctiva, mild pharyngeal erythema" />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Temp (°C)"><Input inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37.0" /></Field>
              <Field label="Pulse (bpm)"><Input inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="78" /></Field>
              <Field label="Resp. Rate"><Input inputMode="numeric" value={resp} onChange={(e) => setResp(e.target.value)} placeholder="16" /></Field>
              <Field label="SpO₂ (%)"><Input inputMode="numeric" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="98" /></Field>
              <Field label="BP Systolic"><Input inputMode="numeric" value={bpSys} onChange={(e) => setBpSys(e.target.value)} placeholder="120" /></Field>
              <Field label="BP Diastolic"><Input inputMode="numeric" value={bpDia} onChange={(e) => setBpDia(e.target.value)} placeholder="80" /></Field>
              <Field label="Weight (kg)"><Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" /></Field>
              <Field label="Height (cm)"><Input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" /></Field>
            </div>

            <div className="space-y-1.5">
              <Label>Additional Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Observation"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : vitals.length === 0 ? (
            <EmptyState icon={<Activity className="h-6 w-6" />} title="No vitals recorded" className="border-0" />
          ) : (
            <ol className="relative space-y-6 border-l border-border p-5 pl-9">
              {vitals.map((v) => (
                <li key={v.id} className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-primary bg-background" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {fmtDateTime(v.recorded_at)} · {v.recorded_by_name ?? "—"}
                  </p>
                  {v.chief_complaint && <p className="mt-0.5 font-medium">{v.chief_complaint}</p>}
                  {v.symptoms.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {v.symptoms.map((s) => (
                        <Badge key={s} variant="outline" className="font-normal">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {v.temperature_c != null && <span>Temp {v.temperature_c}°C</span>}
                    {v.pulse_bpm != null && <span>Pulse {v.pulse_bpm} bpm</span>}
                    {v.resp_rate != null && <span>RR {v.resp_rate}/min</span>}
                    {(v.bp_systolic != null && v.bp_diastolic != null) && <span>BP {v.bp_systolic}/{v.bp_diastolic}</span>}
                    {v.spo2_percent != null && <span>SpO₂ {v.spo2_percent}%</span>}
                    {v.weight_kg != null && <span>Wt {v.weight_kg}kg</span>}
                    {v.height_cm != null && <span>Ht {v.height_cm}cm</span>}
                  </div>
                  {v.signs && <p className="mt-1 text-sm">Signs: {v.signs}</p>}
                  {v.notes && <p className="mt-1 text-sm text-muted-foreground">{v.notes}</p>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Diagnosis ──────────────────────────────────────────────────────

function DiagnosisTab({
  patientId, diagnoses, loading, onSaved,
}: {
  patientId: string; diagnoses: DiagnosisRow[]; loading: boolean; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [type, setType] = useState<"Provisional" | "Confirmed" | "Differential">("Provisional");
  const [icd10, setIcd10] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!diagnosis.trim()) { toast.error("Enter a diagnosis"); return; }
    setSaving(true);
    const { error } = await supabase.from("diagnoses").insert({
      patient_id: patientId,
      diagnosis,
      diagnosis_type: type,
      icd10_code: icd10 || null,
      notes: notes || null,
      diagnosed_by: user?.id ?? null,
      diagnosed_by_name: user?.name ?? null,
    });
    setSaving(false);
    if (error) {
      console.error("Failed to save diagnosis:", error);
      toast.error("Failed to save diagnosis");
      return;
    }
    toast.success("Diagnosis recorded");
    setDiagnosis(""); setIcd10(""); setNotes(""); setType("Provisional");
    setOpen(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{diagnoses.length} diagnosis record(s)</p>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1.5 h-4 w-4" /> {open ? "Close" : "Add Diagnosis"}
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Diagnosis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Diagnosis</Label>
                <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute Malaria" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Provisional">Provisional</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Differential">Differential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ICD-10 Code (optional)</Label>
                <Input value={icd10} onChange={(e) => setIcd10(e.target.value)} placeholder="e.g. B54" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Clinical Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Diagnosis"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : diagnoses.length === 0 ? (
            <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="No diagnoses recorded" className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>ICD-10</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnoses.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground">{fmtDateTime(d.created_at)}</TableCell>
                    <TableCell className="font-medium">{d.diagnosis}</TableCell>
                    <TableCell><Badge variant="outline">{d.diagnosis_type}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{d.icd10_code ?? "—"}</TableCell>
                    <TableCell>{d.diagnosed_by_name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Prescriptions ────────────────────────────────────────────────

function PrescriptionsTab({
  patientId, patientName, prescriptions, drugs, loading, onSaved,
}: {
  patientId: string; patientName: string; prescriptions: PrescriptionRow[];
  drugs: DrugOption[]; loading: boolean; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [drugId, setDrugId] = useState("");
  const [customDrug, setCustomDrug] = useState("");
  const [dose, setDose] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedDrug = drugs.find((d) => d.id === drugId);

  const submit = async () => {
    const drugName = selectedDrug?.name ?? customDrug.trim();
    if (!drugName || !dose.trim() || !quantity.trim()) {
      toast.error("Select/enter a drug, dose and quantity");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("prescriptions").insert({
      patient_id: patientId,
      patient_name: patientName,
      drug_id: selectedDrug?.id ?? null,
      drug_name: drugName,
      dose,
      quantity,
      prescribed_by: user?.id ?? null,
      prescribed_by_name: user?.name ?? null,
      dispensed: false,
    });
    setSaving(false);
    if (error) {
      console.error("Failed to save prescription:", error);
      toast.error("Failed to save prescription");
      return;
    }
    toast.success(`${drugName} prescribed`);
    setDrugId(""); setCustomDrug(""); setDose(""); setQuantity("");
    setOpen(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{prescriptions.length} prescription(s)</p>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1.5 h-4 w-4" /> {open ? "Close" : "Add Prescription"}
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Prescription</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Drug (from pharmacy inventory)</Label>
              <Select value={drugId} onValueChange={(v) => { setDrugId(v); setCustomDrug(""); }}>
                <SelectTrigger><SelectValue placeholder="Select a drug" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {drugs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} {d.stock <= 0 && "(out of stock)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Or type a drug name not in inventory</Label>
              <Input value={customDrug} onChange={(e) => { setCustomDrug(e.target.value); setDrugId(""); }}
                placeholder="e.g. Paracetamol 500mg" disabled={!!drugId} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dose"><Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500mg TDS" /></Field>
              <Field label="Quantity / Duration"><Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 5 days" /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Prescription"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : prescriptions.length === 0 ? (
            <EmptyState icon={<Pill className="h-6 w-6" />} title="No prescriptions" className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Drug</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{fmtDateTime(p.created_at)}</TableCell>
                    <TableCell className="font-medium">{p.drug_name}</TableCell>
                    <TableCell>{p.dose}</TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>{p.prescribed_by_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.dispensed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : ""}>
                        {p.dispensed ? "Dispensed" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Lab Orders & Results ──────────────────────────────────────────

function LabsTab({
  patientId, patientName, nationalId, orders, results, loading, onSaved,
}: {
  patientId: string; patientName: string; nationalId: string;
  orders: LabOrderRow[]; results: LabResultRow[]; loading: boolean; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tests, setTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<LabPriority>("Routine");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (tests.length === 0) { toast.error("Select at least one test"); return; }
    setSaving(true);
    const orderNo = `LAB-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("lab_orders").insert({
      order_no: orderNo,
      patient_id: patientId,
      patient_name: patientName,
      national_id: nationalId,
      tests,
      ordered_by: user?.id ?? null,
      ordered_by_name: user?.name ?? null,
      priority,
      status: "Pending",
    });
    setSaving(false);
    if (error) {
      console.error("Failed to create lab order:", error);
      toast.error("Failed to create lab order");
      return;
    }
    toast.success(`Order ${orderNo} sent to laboratory`);
    setTests([]); setPriority("Routine");
    setOpen(false);
    onSaved();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Lab Orders</h3>
          <Button onClick={() => setOpen((o) => !o)}>
            <Plus className="mr-1.5 h-4 w-4" /> {open ? "Close" : "Order Lab Test"}
          </Button>
        </div>

        {open && (
          <Card>
            <CardHeader><CardTitle className="text-base">New Lab Order</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tests</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-56 overflow-auto">
                  {LAB_TESTS.map((t) => {
                    const checked = tests.includes(t);
                    return (
                      <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(v) =>
                          setTests((prev) => v ? [...prev, t] : prev.filter((x) => x !== t))} />
                        {t}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as LabPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="STAT">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving}>{saving ? "Sending…" : "Send to Lab"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : orders.length === 0 ? (
              <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No lab orders yet" className="border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.order_no}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px]">{o.tests.join(", ")}</TableCell>
                      <TableCell><Badge variant="outline">{o.priority}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{fmtDateTime(o.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Lab Results</h3>
        {results.some((r) => r.is_critical) && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <p className="text-sm font-medium">This patient has critical lab values — review below.</p>
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : results.length === 0 ? (
              <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No results yet" description="Results entered by the lab will appear here." className="border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Reference Range</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Verified By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id} className={r.flag !== "Normal" ? "bg-red-50/40" : ""}>
                      <TableCell className="font-medium">{r.test_name}</TableCell>
                      <TableCell className={r.flag !== "Normal" ? "font-semibold text-red-700" : ""} title={r.notes ?? undefined}>
                        {r.result}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.reference_range ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={flagClass(r.flag)}>{r.flag}</Badge></TableCell>
                      <TableCell>
                        {r.image_url ? (
                          <a href={r.image_url} target="_blank" rel="noopener noreferrer" title="Open full-size image">
                            <img
                              src={r.image_url}
                              alt={`${r.test_name} result`}
                              className="h-10 w-10 rounded border object-cover hover:ring-2 hover:ring-[#0057A8] transition"
                            />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{r.verified_by_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtDateTime(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Referrals ──────────────────────────────────────────────────────

function ReferralsTab({
  patientId, patientName, nationalId, referrals, loading, onSaved,
}: {
  patientId: string; patientName: string; nationalId: string;
  referrals: ReferralRow[]; loading: boolean; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [facility, setFacility] = useState("");
  const [urgency, setUrgency] = useState<"Routine" | "Urgent" | "Emergency">("Routine");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!facility || !reason.trim()) { toast.error("Select a facility and enter a reason"); return; }
    setSaving(true);
    const refNo = `REF-${Date.now().toString().slice(-5)}`;
    const { error } = await supabase.from("referrals").insert({
      ref_no: refNo,
      patient_id: patientId,
      patient_name: patientName,
      national_id: nationalId,
      sent_to: facility,
      urgency,
      status: "Pending",
      reason,
      referred_by: user?.id ?? null,
      referred_by_name: user?.name ?? null,
      date_sent: new Date().toISOString().split("T")[0],
    });
    setSaving(false);
    if (error) {
      console.error("Failed to create referral:", error);
      toast.error("Failed to create referral");
      return;
    }
    toast.success(`Referral ${refNo} created`);
    setFacility(""); setReason(""); setUrgency("Routine");
    setOpen(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{referrals.length} referral(s)</p>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1.5 h-4 w-4" /> {open ? "Close" : "Refer Patient"}
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Referral</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Receiving Facility</Label>
              <Select value={facility} onValueChange={setFacility}>
                <SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger>
                <SelectContent>
                  {RECEIVING_FACILITIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason for Referral</Label>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Cardiology review for resistant hypertension" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Sending…" : "Send Referral"}</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              For a printable referral letter, use the full Referrals page.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : referrals.length === 0 ? (
            <EmptyState icon={<Share2 className="h-6 w-6" />} title="No referrals" className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral ID</TableHead>
                  <TableHead>Sent To</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.ref_no}</TableCell>
                    <TableCell>{r.sent_to}</TableCell>
                    <TableCell><Badge variant="outline" className={urgencyClass(r.urgency)}>{r.urgency}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{r.date_sent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Medical History ────────────────────────────────────────────────

function HistoryTab({
  patientId, history, loading, onSaved,
}: {
  patientId: string; history: MedicalHistoryRow[]; loading: boolean; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof HISTORY_CATEGORIES)[number]>("Condition");
  const [description, setDescription] = useState("");
  const [onsetDate, setOnsetDate] = useState("");
  const [status, setStatus] = useState<"Active" | "Resolved" | "Chronic">("Active");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!description.trim()) { toast.error("Enter a description"); return; }
    setSaving(true);
    const { error } = await supabase.from("medical_history").insert({
      patient_id: patientId,
      category,
      description,
      onset_date: onsetDate || null,
      status,
      recorded_by: user?.id ?? null,
      recorded_by_name: user?.name ?? null,
    });
    setSaving(false);
    if (error) {
      console.error("Failed to save medical history:", error);
      toast.error("Failed to save record");
      return;
    }
    toast.success("Medical history updated");
    setDescription(""); setOnsetDate(""); setCategory("Condition"); setStatus("Active");
    setOpen(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{history.length} history record(s)</p>
        <Button onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1.5 h-4 w-4" /> {open ? "Close" : "Add History Record"}
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Medical History Record</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HISTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Chronic">Chronic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Onset Date (optional)</Label>
                <Input type="date" value={onsetDate} onChange={(e) => setOnsetDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Type 2 Diabetes diagnosed 2019; Appendectomy 2015; Father has hypertension" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Record"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : history.length === 0 ? (
            <EmptyState icon={<History className="h-6 w-6" />} title="No medical history recorded" className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell><Badge variant="outline">{h.category}</Badge></TableCell>
                    <TableCell className="font-medium">{h.description}</TableCell>
                    <TableCell className="text-muted-foreground">{h.onset_date ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        h.status === "Active" ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                        : h.status === "Chronic" ? "border-red-500/30 bg-red-500/10 text-red-700"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                      }>{h.status}</Badge>
                    </TableCell>
                    <TableCell>{h.recorded_by_name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Medical Summary ────────────────────────────────────────────────

function SummaryTab({
  patientId, summaries, loading, onSaved, patient, vitals, diagnoses, prescriptions,
}: {
  patientId: string; summaries: SummaryRow[]; loading: boolean; onSaved: () => void;
  patient: PatientRecord; vitals: VitalsRow[]; diagnoses: DiagnosisRow[]; prescriptions: PrescriptionRow[];
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const generateDraft = () => {
    const age = calculateAge(patient.dob);
    const lines: string[] = [];
    lines.push(`Patient: ${patient.full_name}, ${age}y ${patient.gender}, National ID ${patient.national_id}.`);
    if (patient.allergies.length > 0) lines.push(`Known allergies: ${patient.allergies.join(", ")}.`);
    const latestVitals = vitals[0];
    if (latestVitals) {
      const vitalsParts: string[] = [];
      if (latestVitals.chief_complaint) vitalsParts.push(`presenting with ${latestVitals.chief_complaint.toLowerCase()}`);
      if (latestVitals.symptoms.length > 0) vitalsParts.push(`symptoms include ${latestVitals.symptoms.join(", ").toLowerCase()}`);
      if (vitalsParts.length > 0) lines.push(`Most recent visit: ${vitalsParts.join("; ")}.`);
    }
    if (diagnoses.length > 0) {
      lines.push(`Diagnoses: ${diagnoses.slice(0, 5).map((d) => `${d.diagnosis} (${d.diagnosis_type})`).join("; ")}.`);
    }
    if (prescriptions.length > 0) {
      lines.push(`Current/recent medications: ${prescriptions.slice(0, 5).map((p) => `${p.drug_name} ${p.dose}`).join("; ")}.`);
    }
    setText(lines.join("\n\n"));
  };

  const submit = async () => {
    if (!text.trim()) { toast.error("Write or generate a summary first"); return; }
    setSaving(true);
    const { error } = await supabase.from("clinical_summaries").insert({
      patient_id: patientId,
      summary: text,
      authored_by: user?.id ?? null,
      authored_by_name: user?.name ?? null,
    });
    setSaving(false);
    if (error) {
      console.error("Failed to save summary:", error);
      toast.error("Failed to save medical summary");
      return;
    }
    toast.success("Medical summary saved");
    setText("");
    onSaved();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Write Medical Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={generateDraft}>
              <NotebookPen className="mr-1.5 h-3.5 w-3.5" /> Generate Draft from Records
            </Button>
          </div>
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Summarize the patient's condition, course of treatment and recommendations…"
          />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Summary"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Previous Summaries</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : summaries.length === 0 ? (
            <div className="p-5"><EmptyState icon={<NotebookPen className="h-6 w-6" />} title="No summaries yet" className="border-0" /></div>
          ) : (
            <ul className="divide-y">
              {summaries.map((s) => (
                <li key={s.id} className="space-y-1 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {fmtDateTime(s.updated_at)} · {s.authored_by_name ?? "—"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{s.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
