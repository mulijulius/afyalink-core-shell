import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { AlertTriangle, Camera, Check, ClipboardList, FlaskConical, ImagePlus, Plus, Printer, Search, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";

const LAB_TESTS = [
  "Full Blood Count", "Malaria RDT", "Blood Glucose", "Urinalysis",
  "HIV Rapid Test", "Widal Test", "Lipid Profile", "Liver Function Tests",
  "Chest X-Ray", "Sputum AFB",
] as const;

const SAMPLE_STAGES = ["Collected", "Received by Lab", "Processing", "Results Ready"] as const;
type SampleStage = (typeof SAMPLE_STAGES)[number];

type LabPriority = Database["public"]["Enums"]["lab_priority"];
type LabOrderStatus = Database["public"]["Enums"]["lab_order_status"];
type ResultFlag = Database["public"]["Enums"]["result_flag"];
type PatientOption = { id: string; full_name: string; national_id: string; gender: Database["public"]["Enums"]["gender"]; dob: string };

type LabOrderRow = {
  id: string;
  order_no: string;
  patient_id: string | null;
  patient_name: string;
  national_id: string | null;
  tests: string[];
  ordered_by_name: string | null;
  priority: LabPriority;
  status: LabOrderStatus;
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
  sample_id: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  // joined from lab_orders for display
  patient_name?: string;
};

export const Route = createFileRoute("/laboratory")({
  component: LaboratoryPage,
});

const priorityClass = (p: LabPriority) =>
  p === "STAT" ? "bg-red-100 text-red-700 border-red-200"
  : p === "Urgent" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-slate-100 text-slate-700 border-slate-200";

const statusClass = (s: LabOrderStatus) =>
  s === "Completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
  : s === "Processing" ? "bg-sky-100 text-sky-700 border-sky-200"
  : s === "Collected" ? "bg-indigo-100 text-indigo-700 border-indigo-200"
  : "bg-slate-100 text-slate-700 border-slate-200";

const flagClass = (f: ResultFlag) =>
  f === "High" ? "bg-red-100 text-red-700 border-red-200"
  : f === "Low" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-emerald-100 text-emerald-700 border-emerald-200";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Derives a sample-journey stage from an order's lab_order_status, used for the Sample Tracking tab. */
const stageFromOrderStatus = (status: LabOrderStatus): SampleStage =>
  status === "Pending" ? "Collected"
  : status === "Collected" ? "Received by Lab"
  : status === "Processing" ? "Processing"
  : "Results Ready";

function NewOrderDialog({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [tests, setTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<LabPriority>("Routine");
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return patients.filter(p => p.full_name.toLowerCase().includes(q) || p.national_id.includes(q)).slice(0, 5);
  }, [query, patients]);

  useEffect(() => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }
    const searchPatients = async () => {
      setSearching(true);
      const q = query.toLowerCase();
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, national_id, gender, dob")
        .or(`full_name.ilike.%${q}%,national_id.ilike.%${q}%`)
        .limit(5);
      if (error) {
        console.error("Failed to search patients:", error);
      }
      setPatients(data ?? []);
      setSearching(false);
    };
    searchPatients();
  }, [query]);

  const reset = () => {
    setQuery("");
    setSelectedPatient(null);
    setTests([]);
    setPriority("Routine");
  };

  const submit = async () => {
    if (!selectedPatient || tests.length === 0) {
      toast.error("Select a patient and at least one test");
      return;
    }
    setSubmitting(true);
    try {
      const orderNo = `LAB-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("lab_orders").insert({
        order_no: orderNo,
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.full_name,
        national_id: selectedPatient.national_id,
        tests,
        ordered_by: user?.id ?? null,
        ordered_by_name: user?.name ?? null,
        priority,
        status: "Pending",
      });
      if (error) {
        console.error("Failed to create lab order:", error);
        toast.error("Failed to create lab order");
        return;
      }
      toast.success(`Order ${orderNo} created`);
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("Error creating lab order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-[#0057A8] hover:bg-[#0057A8]/90"><Plus className="h-4 w-4 mr-1" /> New Lab Order</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New Lab Order</DialogTitle></DialogHeader>

        <div className="space-y-2">
          <Label>Patient</Label>
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-md border p-3 bg-muted/40">
              <div>
                <p className="font-medium">{selectedPatient.full_name}</p>
                <p className="text-xs text-muted-foreground">ID: {selectedPatient.national_id} • {selectedPatient.gender}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Change</Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search by name or National ID" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
              {matches.length > 0 && (
                <div className="rounded-md border divide-y max-h-40 overflow-auto">
                  {matches.map((p) => (
                    <button key={p.id} onClick={() => setSelectedPatient(p)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
                      <span className="font-medium">{p.full_name}</span> <span className="text-muted-foreground">• {p.national_id}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tests</Label>
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-56 overflow-auto">
            {LAB_TESTS.map((t) => {
              const checked = tests.includes(t);
              return (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      setTests((prev) => v ? [...prev, t] : prev.filter(x => x !== t))
                    }
                  />
                  {t}
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-[#0057A8] hover:bg-[#0057A8]/90" onClick={submit} disabled={submitting}>
            {submitting ? "Creating…" : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Lets a Lab Technician record a result against a specific test on an
 * order — either by typing the value in manually, attaching/capturing a
 * photo of the physical result (strip, slide, printout), or both.
 *
 * Camera access uses a plain <input type="file" accept="image/*" capture
 * "environment">, which is the standard dependency-free way to open the
 * device's rear camera directly on a phone/tablet; on desktop it falls
 * back to a normal file picker. No extra permissions/SDK needed.
 */
function RecordResultDialog({
  order,
  test,
  onSaved,
}: {
  order: LabOrderRow;
  test: string;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [flag, setFlag] = useState<ResultFlag>("Normal");
  const [critical, setCritical] = useState(false);
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult("");
    setReferenceRange("");
    setFlag("Normal");
    setCritical(false);
    setNotes("");
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handlePickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const submit = async () => {
    const hasTypedResult = result.trim().length > 0;
    if (!hasTypedResult && !imageFile) {
      toast.error("Enter a result value or attach an image");
      return;
    }
    setSaving(true);
    try {
      let image_url: string | null = null;
      let image_path: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${order.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("lab-result-images")
          .upload(path, imageFile, { contentType: imageFile.type });
        if (uploadError) {
          console.error("Failed to upload result image:", uploadError);
          toast.error("Failed to upload image");
          setSaving(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage
          .from("lab-result-images")
          .getPublicUrl(path);
        image_url = publicUrlData.publicUrl;
        image_path = path;
      }

      const { error } = await supabase.from("lab_results").insert({
        order_id: order.id,
        test_name: test,
        result: hasTypedResult ? result.trim() : "See attached image",
        reference_range: referenceRange.trim() || null,
        flag,
        is_critical: critical,
        verified_by: user?.id ?? null,
        verified_by_name: user?.name ?? null,
        entered_by: user?.id ?? null,
        entered_by_name: user?.name ?? null,
        notes: notes.trim() || null,
        image_url,
        image_path,
      });
      if (error) {
        console.error("Failed to record lab result:", error);
        toast.error("Failed to record result");
        return;
      }

      // Move the order along automatically: Pending/Collected → Processing,
      // and once every ordered test has at least one result, → Completed.
      const { data: existingResults } = await supabase
        .from("lab_results")
        .select("test_name")
        .eq("order_id", order.id);
      const recordedTests = new Set([...(existingResults ?? []).map((r) => r.test_name), test]);
      const allDone = order.tests.every((t) => recordedTests.has(t));
      const nextStatus: LabOrderStatus = allDone ? "Completed" : "Processing";
      if (nextStatus !== order.status) {
        await supabase.from("lab_orders").update({ status: nextStatus }).eq("id", order.id);
      }

      toast.success(`Result recorded for ${test}`);
      reset();
      setOpen(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Error recording result");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7">
          <ClipboardList className="h-3.5 w-3.5 mr-1" /> Record
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Result — {test}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{order.patient_name}</p>
            <p className="text-xs text-muted-foreground">
              Order {order.order_no} • Ordered by {order.ordered_by_name ?? "—"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Result value</Label>
            <Input
              placeholder="e.g. 9.2 g/dL, P. falciparum +, Negative…"
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if you're only attaching a photo of the result.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Reference range</Label>
              <Input
                placeholder="e.g. 12.0 – 16.0 g/dL"
                value={referenceRange}
                onChange={(e) => setReferenceRange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Flag</Label>
              <Select value={flag} onValueChange={(v) => setFlag(v as ResultFlag)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Mark as critical value</Label>
              <p className="text-xs text-muted-foreground">Flags this result for urgent clinician review.</p>
            </div>
            <Switch checked={critical} onCheckedChange={setCritical} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any observations for the requesting clinician…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Attach result image (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full max-w-xs">
                <img src={imagePreview} alt="Captured result" className="rounded-md border max-h-56 w-full object-cover" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={clearImage}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-1.5" /> Take Photo
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-1.5" /> Upload Image
                </Button>
              </div>
            )}
            {/* capture="environment" opens the rear camera directly on mobile devices */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePickImage}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePickImage}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-[#0057A8] hover:bg-[#0057A8]/90" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save Result"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LaboratoryPage() {
  const [orders, setOrders] = useState<LabOrderRow[]>([]);
  const [results, setResults] = useState<LabResultRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from("lab_orders")
      .select("id, order_no, patient_id, patient_name, national_id, tests, ordered_by_name, priority, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load lab orders:", error);
      toast.error("Failed to load lab orders");
      setOrders([]);
    } else {
      setOrders(data ?? []);
    }
    setOrdersLoading(false);
  }, []);

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    const { data, error } = await supabase
      .from("lab_results")
      .select(
        "id, order_id, test_name, result, reference_range, flag, is_critical, verified_by_name, sample_id, image_url, notes, created_at, lab_orders(patient_name)",
      )
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load lab results:", error);
      toast.error("Failed to load lab results");
      setResults([]);
    } else {
      type ResultJoinRow = {
        id: string;
        order_id: string;
        test_name: string;
        result: string;
        reference_range: string | null;
        flag: ResultFlag;
        is_critical: boolean;
        verified_by_name: string | null;
        sample_id: string | null;
        image_url: string | null;
        notes: string | null;
        created_at: string;
        lab_orders: { patient_name: string } | null;
      };
      const rows = (data ?? []) as unknown as ResultJoinRow[];
      const mapped: LabResultRow[] = rows.map((r) => ({
        id: r.id,
        order_id: r.order_id,
        test_name: r.test_name,
        result: r.result,
        reference_range: r.reference_range,
        flag: r.flag,
        is_critical: r.is_critical,
        verified_by_name: r.verified_by_name,
        sample_id: r.sample_id,
        image_url: r.image_url,
        notes: r.notes,
        created_at: r.created_at,
        patient_name: r.lab_orders?.patient_name ?? "—",
      }));
      setResults(mapped);
    }
    setResultsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchResults();
  }, [fetchOrders, fetchResults]);

  const criticals = useMemo(() => results.filter((r) => r.is_critical), [results]);

  // Which tests (per order) already have a recorded result — used to show
  // "Recorded" vs a "Record" action for each individual test on an order.
  const recordedTestsByOrder = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of results) {
      if (!map.has(r.order_id)) map.set(r.order_id, new Set());
      map.get(r.order_id)!.add(r.test_name);
    }
    return map;
  }, [results]);

  // Sample tracking is derived from existing orders, mapping each order's
  // lab_order_status onto the physical sample journey stages.
  const sampleTracks = useMemo(
    () =>
      orders.map((o) => ({
        sampleId: `SMP-${o.order_no.replace(/\D/g, "").slice(-4) || o.id.slice(0, 4).toUpperCase()}`,
        patient: o.patient_name,
        test: o.tests[0] ?? "—",
        stage: stageFromOrderStatus(o.status),
        updated: fmtTime(o.created_at),
      })),
    [orders],
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-[#0057A8]" />
        <h1 className="text-2xl font-semibold">Laboratory</h1>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Test Orders</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="samples">Sample Tracking</TabsTrigger>
        </TabsList>

        {/* ORDERS */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{orders.length} active orders</p>
            <NewOrderDialog onCreated={() => { fetchOrders(); fetchResults(); }} />
          </div>
          <Card>
            <CardContent className="p-0">
              {ordersLoading ? (
                <div className="p-4"><TableSkeleton cols={8} /></div>
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={<FlaskConical className="h-6 w-6" />}
                  title="No lab orders yet"
                  description="New orders created here will appear in real time."
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Ordered By</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.order_no}</TableCell>
                        <TableCell className="font-medium">{o.patient_name}</TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="flex flex-wrap gap-1.5">
                            {o.tests.map((t) => {
                              const isRecorded = recordedTestsByOrder.get(o.id)?.has(t) ?? false;
                              return isRecorded ? (
                                <Badge key={t} variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                  <Check className="h-3 w-3 mr-1" /> {t}
                                </Badge>
                              ) : (
                                <div key={t} className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">{t}</span>
                                  <RecordResultDialog
                                    order={o}
                                    test={t}
                                    onSaved={() => { fetchOrders(); fetchResults(); }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{o.ordered_by_name ?? "—"}</TableCell>
                        <TableCell>{fmtTime(o.created_at)}</TableCell>
                        <TableCell><Badge variant="outline" className={priorityClass(o.priority)}>{o.priority}</Badge></TableCell>
                        <TableCell>
                          <Select
                            value={o.status}
                            onValueChange={async (v) => {
                              const nextStatus = v as LabOrderStatus;
                              const { error } = await supabase
                                .from("lab_orders")
                                .update({ status: nextStatus })
                                .eq("id", o.id);
                              if (error) {
                                console.error("Failed to update order status:", error);
                                toast.error("Failed to update status");
                                return;
                              }
                              setOrders((prev) =>
                                prev.map((row) => (row.id === o.id ? { ...row, status: nextStatus } : row)),
                              );
                              toast.success(`Order ${o.order_no} marked ${nextStatus}`);
                            }}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <Badge variant="outline" className={statusClass(o.status)}>{o.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Collected">Collected</SelectItem>
                              <SelectItem value="Processing">Processing</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {(recordedTestsByOrder.get(o.id)?.size ?? 0)} / {o.tests.length} recorded
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTS */}
        <TabsContent value="results" className="space-y-4">
          {criticals.map((c) => (
            <div key={c.id} className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <p className="text-sm font-medium">
                ⚠ Critical Value: Patient {c.patient_name} — {c.test_name.replace(/\s*\(.*\)/, "")} {c.result}
              </p>
            </div>
          ))}
          <Card>
            <CardContent className="p-0">
              {resultsLoading ? (
                <div className="p-4"><TableSkeleton cols={9} /></div>
              ) : results.length === 0 ? (
                <EmptyState
                  icon={<FlaskConical className="h-6 w-6" />}
                  title="No results recorded yet"
                  description="Verified lab results will show up here as they're entered."
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Reference Range</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Verified By</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => {
                      const abnormal = r.flag !== "Normal";
                      return (
                        <TableRow key={r.id} className={abnormal ? "bg-red-50/40" : ""}>
                          <TableCell className="font-mono text-xs">{r.order_id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium">{r.patient_name}</TableCell>
                          <TableCell>{r.test_name}</TableCell>
                          <TableCell className={abnormal ? "font-semibold text-red-700" : ""} title={r.notes ?? undefined}>
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
                          <TableCell>{fmtTime(r.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => toast.success("Sending to printer…")}>
                              <Printer className="h-3.5 w-3.5 mr-1" /> Print
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAMPLES */}
        <TabsContent value="samples" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Sample Journey</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                {SAMPLE_STAGES.map((s, i) => (
                  <div key={s} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="h-9 w-9 rounded-full bg-[#0057A8] text-white grid place-content-center text-sm font-semibold">{i + 1}</div>
                      <p className="mt-2 text-xs md:text-sm font-medium">{s}</p>
                    </div>
                    {i < SAMPLE_STAGES.length - 1 && <div className="h-0.5 flex-1 bg-[#0057A8]/30" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {ordersLoading ? (
                <div className="p-4"><TableSkeleton cols={6} /></div>
              ) : sampleTracks.length === 0 ? (
                <EmptyState
                  icon={<FlaskConical className="h-6 w-6" />}
                  title="No samples in transit"
                  description="Samples linked to lab orders will be tracked here."
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sample ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleTracks.map((s) => {
                      const idx = SAMPLE_STAGES.indexOf(s.stage);
                      return (
                        <TableRow key={s.sampleId}>
                          <TableCell className="font-mono text-xs">{s.sampleId}</TableCell>
                          <TableCell className="font-medium">{s.patient}</TableCell>
                          <TableCell>{s.test}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {SAMPLE_STAGES.map((_, i) => (
                                <div key={i} className={`h-1.5 w-8 rounded-full ${i <= idx ? "bg-[#00A651]" : "bg-slate-200"}`} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={s.stage === "Results Ready" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-sky-100 text-sky-700 border-sky-200"}>
                              {s.stage === "Results Ready" && <Check className="h-3 w-3 mr-1" />}
                              {s.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>{s.updated}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
