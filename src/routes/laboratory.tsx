import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import { AlertTriangle, Check, FlaskConical, Plus, Printer, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
        "id, order_id, test_name, result, reference_range, flag, is_critical, verified_by_name, sample_id, created_at, lab_orders(patient_name)",
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
                        <TableCell className="text-sm text-muted-foreground max-w-[260px]">{o.tests.join(", ")}</TableCell>
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
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
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
                          <TableCell className={abnormal ? "font-semibold text-red-700" : ""}>{r.result}</TableCell>
                          <TableCell className="text-muted-foreground">{r.reference_range ?? "—"}</TableCell>
                          <TableCell><Badge variant="outline" className={flagClass(r.flag)}>{r.flag}</Badge></TableCell>
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
