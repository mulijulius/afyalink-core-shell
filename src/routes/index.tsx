import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, ListOrdered, BedDouble, AlertTriangle,
  FlaskConical, Pill, Receipt, Share2, Clock,
  CheckCircle2, Building2, Phone, Mail, Shield, Activity,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AfyaLink HMS" },
      { name: "description", content: "Clinical dashboard for Kapsabet Referral Hospital." },
    ],
  }),
  component: Dashboard,
});

type Triage = Database["public"]["Enums"]["triage_level"];
type LabPriority = Database["public"]["Enums"]["lab_priority"];
type LabOrderStatus = Database["public"]["Enums"]["lab_order_status"];

const STATUS_CLASS: Record<string, string> = {
  "In Consult":       "bg-primary/10 text-primary border-primary/20",
  Dispensing:         "bg-accent/10 text-accent border-accent/30",
  "Awaiting Results": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  Waiting:            "bg-muted text-muted-foreground border-border",
  Triaged:            "bg-muted text-muted-foreground border-border",
  Admitted:           "bg-accent/10 text-accent border-accent/30",
  Done:               "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  "Did Not Wait":     "bg-muted text-muted-foreground border-border",
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const fmtWait = (iso: string) => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const lastNDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── Shared components ───────────────────────────────────────────

type Stat = { label: string; value: string; hint?: string; icon: LucideIcon; tone?: "primary" | "accent" | "warning" };

function StatCard({ s }: { s: Stat }) {
  const cls =
    s.tone === "warning" ? "bg-destructive/10 text-destructive"
    : s.tone === "accent" ? "bg-accent/10 text-accent"
    : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${cls}`}>
          <s.icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
        {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
      </CardContent>
    </Card>
  );
}

/** User identity card shown on every dashboard below the header */
function UserCredentialCard({ name, role, email, department, facility, phone, initials }: {
  name: string; role: string | null; email: string;
  department: string | null; facility: string; phone: string | null; initials: string;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
                <Shield className="mr-1 h-3 w-3" />{role ?? "Pending"}
              </Badge>
              {department && (
                <Badge variant="outline" className="text-xs">
                  <Building2 className="mr-1 h-3 w-3" />{department}
                </Badge>
              )}
            </div>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>
              {phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{phone}</span>}
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{facility}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

// ── Shared data hooks ────────────────────────────────────────────

/** 7-day visit trend, derived from real `visits` rows. */
function useWeekVisits() {
  const [data, setData] = useState<{ day: string; visits: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = lastNDays(7);
      const { data: rows, error } = await supabase
        .from("visits")
        .select("visit_date")
        .gte("visit_date", since.toISOString().split("T")[0]);
      if (error) {
        console.error("Failed to load weekly visits:", error);
        setData([]);
        setLoading(false);
        return;
      }
      const buckets: { day: string; visits: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString([], { weekday: "short" });
        const count = (rows ?? []).filter((r) => r.visit_date === key).length;
        buckets.push({ day: label, visits: count });
      }
      setData(buckets);
      setLoading(false);
    };
    run();
  }, []);

  return { data, loading };
}

/** Top diagnoses this month, derived from `visits.diagnosis`. */
function useTopDiagnoses(limit = 5) {
  const [data, setData] = useState<{ name: string; cases: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data: rows, error } = await supabase
        .from("visits")
        .select("diagnosis")
        .gte("visit_date", monthStart.toISOString().split("T")[0])
        .not("diagnosis", "is", null);
      if (error) {
        console.error("Failed to load diagnoses:", error);
        setData([]);
        setLoading(false);
        return;
      }
      const counts = new Map<string, number>();
      for (const r of rows ?? []) {
        const dx = (r.diagnosis ?? "").trim();
        if (!dx) continue;
        counts.set(dx, (counts.get(dx) ?? 0) + 1);
      }
      const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, cases]) => ({ name, cases }));
      setData(sorted);
      setLoading(false);
    };
    run();
  }, [limit]);

  return { data, loading };
}

function useLowStock(limit = 4) {
  const [items, setItems] = useState<Array<{ name: string; qty: number; unit: string }>>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("pharmacy_drugs")
      .select("name, stock, unit, reorder_level");
    if (error) {
      console.error("Failed to load pharmacy stock:", error);
      setItems([]);
      setLoading(false);
      return;
    }
    const low = (data ?? [])
      .filter((d) => d.stock < d.reorder_level)
      .map((d) => ({ name: d.name, qty: d.stock, unit: d.unit }))
      .slice(0, limit);
    setItems(low);
    setLoading(false);
  }, [limit]);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, loading };
}

// ── Role dashboards ────────────────────────────────────────────

function AdminDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const { items: lowStockItems, loading: stockLoading } = useLowStock(4);
  const { data: weekVisits, loading: visitsLoading } = useWeekVisits();
  const { data: diagnoses, loading: dxLoading } = useTopDiagnoses(5);

  const [patientsToday, setPatientsToday] = useState<number | null>(null);
  const [queueWaiting, setQueueWaiting] = useState<number | null>(null);
  const [recentPatients, setRecentPatients] = useState<
    Array<{ id: string; name: string; nationalId: string; time: string; dept: string; status: string }>
  >([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = startOfToday();

      const [{ count: visitCount }, { count: waitingCount }, { data: queueRows, error: queueError }] =
        await Promise.all([
          supabase.from("visits").select("id", { count: "exact", head: true }).gte("created_at", since),
          supabase.from("opd_queue").select("id", { count: "exact", head: true }).eq("status", "Waiting"),
          supabase
            .from("opd_queue")
            .select("id, patient_name, check_in_time, status")
            .order("check_in_time", { ascending: false })
            .limit(5),
        ]);

      setPatientsToday(visitCount ?? 0);
      setQueueWaiting(waitingCount ?? 0);

      if (queueError) {
        console.error("Failed to load recent patients:", queueError);
        setRecentPatients([]);
      } else {
        setRecentPatients(
          (queueRows ?? []).map((q) => ({
            id: q.id,
            name: q.patient_name,
            nationalId: "—",
            time: fmtTime(q.check_in_time),
            dept: "OPD",
            status: q.status,
          })),
        );
      }
      setRecentLoading(false);
    };
    run();
  }, []);

  const stats: Stat[] = [
    { label: "Patients Today",          value: patientsToday === null ? "—" : String(patientsToday), icon: Users,         tone: "primary" },
    { label: "Currently Waiting (OPD)", value: queueWaiting === null ? "—" : String(queueWaiting),    icon: ListOrdered,   tone: "primary" },
    { label: "Beds Occupied",           value: "Not tracked", hint: "No bed/inpatient table yet", icon: BedDouble, tone: "accent" },
    { label: "Drug Stock Alerts",       value: String(lowStockItems.length), icon: AlertTriangle, tone: "warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back, {name}. Here's today's facility snapshot.</p>
      </div>
      <UserCredentialCard name={name} role="Admin" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Patient Visits This Week</CardTitle></CardHeader>
          <CardContent className="h-72">
            {visitsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekVisits} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="visits" stroke="var(--color-primary)" strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--color-primary)" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Diagnoses This Month</CardTitle></CardHeader>
          <CardContent className="h-72">
            {dxLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : diagnoses.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No diagnoses recorded this month yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diagnoses} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="cases" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Patients</CardTitle></CardHeader>
          <CardContent>
            {recentLoading ? (
              <TableSkeleton cols={5} rows={5} />
            ) : recentPatients.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title="No recent patients" description="Patients checked into the OPD queue will appear here." className="border-0" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead><TableHead>Time</TableHead>
                      <TableHead>Department</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPatients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.time}</TableCell>
                        <TableCell>{p.dept}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_CLASS[p.status] ?? ""}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">{lowStockItems.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {stockLoading ? (
              <TableSkeleton cols={2} rows={4} />
            ) : lowStockItems.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="No low stock items" className="border-0" />
            ) : (
              lowStockItems.map((d) => (
                <div key={d.name} className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.qty} {d.unit} remaining</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />Low
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClinicianDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const [queue, setQueue] = useState<
    Array<{ queueNo: string; patient: string; triage: Triage; wait: string; status: string }>
  >([]);
  const [criticalResults, setCriticalResults] = useState<
    Array<{ patient: string; test: string; result: string }>
  >([]);
  const [referralsSent, setReferralsSent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = startOfToday();
      const [{ data: queueRows, error: queueError }, { data: critRows, error: critError }, { count: refCount }] =
        await Promise.all([
          supabase
            .from("opd_queue")
            .select("queue_no, patient_name, check_in_time, triage, status")
            .neq("status", "Done")
            .order("check_in_time", { ascending: true })
            .limit(5),
          supabase
            .from("lab_results")
            .select("test_name, result, lab_orders(patient_name)")
            .eq("is_critical", true)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase.from("referrals").select("id", { count: "exact", head: true }).gte("created_at", since),
        ]);

      if (queueError) {
        console.error("Failed to load queue:", queueError);
        setQueue([]);
      } else {
        setQueue(
          (queueRows ?? []).map((q) => ({
            queueNo: q.queue_no,
            patient: q.patient_name,
            triage: q.triage,
            wait: fmtWait(q.check_in_time),
            status: q.status,
          })),
        );
      }

      if (critError) {
        console.error("Failed to load critical results:", critError);
        setCriticalResults([]);
      } else {
        type CritJoinRow = { test_name: string; result: string; lab_orders: { patient_name: string } | null };
        const rows = (critRows ?? []) as unknown as CritJoinRow[];
        setCriticalResults(
          rows.map((r) => ({
            patient: r.lab_orders?.patient_name ?? "—",
            test: r.test_name,
            result: r.result,
          })),
        );
      }

      setReferralsSent(refCount ?? 0);
      setLoading(false);
    };
    run();
  }, []);

  const stats: Stat[] = [
    { label: "My Queue Today",      value: String(queue.length),            icon: ListOrdered,   tone: "primary" },
    { label: "Critical Lab Results",value: String(criticalResults.length),  icon: FlaskConical,  tone: "warning" },
    { label: "Referrals Sent",      value: referralsSent === null ? "—" : String(referralsSent), icon: Share2, tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Good morning, {name}. Your clinical workload for today.</p>
      </div>
      <UserCredentialCard name={name} role="Clinician" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">My OPD Queue</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton cols={5} rows={3} />
            ) : queue.length === 0 ? (
              <EmptyState icon={<ListOrdered className="h-6 w-6" />} title="Queue is empty" className="border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Queue #</TableHead><TableHead>Patient</TableHead><TableHead>Triage</TableHead><TableHead>Wait</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((q) => (
                    <TableRow key={q.queueNo}>
                      <TableCell className="font-mono text-xs">{q.queueNo}</TableCell>
                      <TableCell className="font-medium">{q.patient}</TableCell>
                      <TableCell><Badge variant="outline">{q.triage}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{q.wait}</TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_CLASS[q.status] ?? ""}>{q.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Critical Lab Results
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">{criticalResults.length} critical</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <TableSkeleton cols={1} rows={3} />
            ) : criticalResults.length === 0 ? (
              <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No critical results" className="border-0" />
            ) : (
              criticalResults.map((r) => (
                <div key={r.patient + r.test} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm font-medium">{r.patient}</p>
                  <p className="text-xs text-muted-foreground">{r.test}: <span className="font-semibold text-destructive">{r.result}</span></p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NurseDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const [queue, setQueue] = useState<
    Array<{ queueNo: string; patient: string; triage: Triage; wait: string; status: string }>
  >([]);
  const [redCount, setRedCount] = useState<number | null>(null);
  const [triagedToday, setTriagedToday] = useState<number | null>(null);
  const [checkInsToday, setCheckInsToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = startOfToday();
      const [{ data: queueRows, error: queueError }, { count: checkIns }, { data: triagedRows }] =
        await Promise.all([
          supabase
            .from("opd_queue")
            .select("queue_no, patient_name, check_in_time, triage, status")
            .neq("status", "Done")
            .order("check_in_time", { ascending: true }),
          supabase.from("opd_queue").select("id", { count: "exact", head: true }).gte("check_in_time", since),
          supabase.from("opd_queue").select("triage, status").gte("check_in_time", since),
        ]);

      if (queueError) {
        console.error("Failed to load queue:", queueError);
        setQueue([]);
      } else {
        setQueue(
          (queueRows ?? []).map((q) => ({
            queueNo: q.queue_no,
            patient: q.patient_name,
            triage: q.triage,
            wait: fmtWait(q.check_in_time),
            status: q.status,
          })),
        );
      }

      setCheckInsToday(checkIns ?? 0);
      const reds = (triagedRows ?? []).filter((r) => r.triage === "Red").length;
      const triaged = (triagedRows ?? []).filter((r) => r.status !== "Waiting").length;
      setRedCount(reds);
      setTriagedToday(triaged);
      setLoading(false);
    };
    run();
  }, []);

  const waitingNow = queue.filter((q) => q.status === "Waiting").length;

  const stats: Stat[] = [
    { label: "Waiting in OPD",  value: String(waitingNow), icon: ListOrdered,  tone: "primary" },
    { label: "Triaged Today",   value: triagedToday === null ? "—" : String(triagedToday), icon: CheckCircle2, tone: "accent" },
    { label: "Red Triage",      value: redCount === null ? "—" : String(redCount), icon: AlertTriangle, tone: "warning" },
    { label: "Total Check-ins", value: checkInsToday === null ? "—" : String(checkInsToday), icon: Users, tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Good morning, {name}. OPD triage overview for today.</p>
      </div>
      <UserCredentialCard name={name} role="Nurse" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Current OPD Queue</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton cols={5} rows={4} />
          ) : queue.length === 0 ? (
            <EmptyState icon={<ListOrdered className="h-6 w-6" />} title="Queue is empty" className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Queue #</TableHead><TableHead>Patient</TableHead><TableHead>Triage</TableHead><TableHead>Wait</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((q) => (
                  <TableRow key={q.queueNo}>
                    <TableCell className="font-mono text-xs">{q.queueNo}</TableCell>
                    <TableCell className="font-medium">{q.patient}</TableCell>
                    <TableCell><Badge variant="outline">{q.triage}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{q.wait}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_CLASS[q.status] ?? ""}>{q.status}</Badge></TableCell>
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

function PharmacistDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const { items: lowStockItems, loading: stockLoading } = useLowStock(4);
  const [pending, setPending] = useState<
    Array<{ patient: string; drug: string; dose: string; qty: string }>
  >([]);
  const [outOfStock, setOutOfStock] = useState<number | null>(null);
  const [dispensedToday, setDispensedToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = startOfToday();
      const [{ data: rxRows, error: rxError }, { data: stockRows }, { count: dispensedCount }] =
        await Promise.all([
          supabase
            .from("prescriptions")
            .select("patient_name, drug_name, dose, quantity")
            .eq("dispensed", false)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase.from("pharmacy_drugs").select("stock"),
          supabase
            .from("prescriptions")
            .select("id", { count: "exact", head: true })
            .eq("dispensed", true)
            .gte("dispensed_at", since),
        ]);

      if (rxError) {
        console.error("Failed to load prescriptions:", rxError);
        setPending([]);
      } else {
        setPending(
          (rxRows ?? []).map((p) => ({
            patient: p.patient_name,
            drug: p.drug_name,
            dose: p.dose,
            qty: p.quantity,
          })),
        );
      }

      setOutOfStock((stockRows ?? []).filter((d) => d.stock === 0).length);
      setDispensedToday(dispensedCount ?? 0);
      setLoading(false);
    };
    run();
  }, []);

  const stats: Stat[] = [
    { label: "Prescriptions to Dispense", value: String(pending.length), icon: Pill,          tone: "primary" },
    { label: "Out of Stock",              value: outOfStock === null ? "—" : String(outOfStock), icon: AlertTriangle, tone: "warning" },
    { label: "Low Stock Items",           value: String(lowStockItems.length), icon: AlertTriangle, tone: "accent" },
    { label: "Dispensed Today",           value: dispensedToday === null ? "—" : String(dispensedToday), icon: CheckCircle2, tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Good morning, {name}. Pharmacy workload for today.</p>
      </div>
      <UserCredentialCard name={name} role="Pharmacist" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Pending Prescriptions</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton cols={4} rows={3} />
            ) : pending.length === 0 ? (
              <EmptyState icon={<Pill className="h-6 w-6" />} title="No pending prescriptions" className="border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Patient</TableHead><TableHead>Drug</TableHead><TableHead>Dose</TableHead><TableHead>Qty</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((p) => (
                    <TableRow key={p.patient + p.drug}>
                      <TableCell className="font-medium">{p.patient}</TableCell>
                      <TableCell className="text-sm">{p.drug}</TableCell>
                      <TableCell className="text-muted-foreground">{p.dose}</TableCell>
                      <TableCell>{p.qty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">{lowStockItems.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {stockLoading ? (
              <TableSkeleton cols={2} rows={4} />
            ) : lowStockItems.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="No low stock items" className="border-0" />
            ) : (
              lowStockItems.map((d) => (
                <div key={d.name} className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.qty} {d.unit} remaining</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />Low
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LabDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const [orders, setOrders] = useState<
    Array<{ id: string; orderNo: string; patient: string; tests: string[]; priority: LabPriority; status: LabOrderStatus }>
  >([]);
  const [criticalResults, setCriticalResults] = useState<
    Array<{ patient: string; test: string; result: string; flag: string }>
  >([]);
  const [completedToday, setCompletedToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = startOfToday();
      const [{ data: orderRows, error: orderError }, { data: critRows, error: critError }, { count: completedCount }] =
        await Promise.all([
          supabase
            .from("lab_orders")
            .select("id, order_no, patient_name, tests, priority, status")
            .neq("status", "Completed")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("lab_results")
            .select("test_name, result, flag, lab_orders(patient_name)")
            .eq("is_critical", true)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("lab_orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "Completed")
            .gte("updated_at", since),
        ]);

      if (orderError) {
        console.error("Failed to load lab orders:", orderError);
        setOrders([]);
      } else {
        setOrders(
          (orderRows ?? []).map((o) => ({
            id: o.id,
            orderNo: o.order_no,
            patient: o.patient_name,
            tests: o.tests,
            priority: o.priority,
            status: o.status,
          })),
        );
      }

      if (critError) {
        console.error("Failed to load critical results:", critError);
        setCriticalResults([]);
      } else {
        type CritJoinRow = { test_name: string; result: string; flag: string; lab_orders: { patient_name: string } | null };
        const rows = (critRows ?? []) as unknown as CritJoinRow[];
        setCriticalResults(
          rows.map((r) => ({
            patient: r.lab_orders?.patient_name ?? "—",
            test: r.test_name,
            result: r.result,
            flag: r.flag,
          })),
        );
      }

      setCompletedToday(completedCount ?? 0);
      setLoading(false);
    };
    run();
  }, []);

  const pending = orders.filter((o) => o.status === "Pending").length;
  const processing = orders.filter((o) => o.status === "Processing").length;

  const stats: Stat[] = [
    { label: "Pending Orders",   value: String(pending),                  icon: FlaskConical, tone: "primary" },
    { label: "Processing",       value: String(processing),               icon: Clock,        tone: "accent" },
    { label: "Critical Results", value: String(criticalResults.length),   icon: AlertTriangle, tone: "warning" },
    { label: "Completed Today",  value: completedToday === null ? "—" : String(completedToday), icon: CheckCircle2, tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Good morning, {name}. Lab workload for today.</p>
      </div>
      <UserCredentialCard name={name} role="Lab Technician" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Active Lab Orders</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton cols={5} rows={4} />
            ) : orders.length === 0 ? (
              <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No active lab orders" className="border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Order #</TableHead><TableHead>Patient</TableHead><TableHead>Tests</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.orderNo}</TableCell>
                      <TableCell className="font-medium">{o.patient}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.tests.join(", ")}</TableCell>
                      <TableCell><Badge variant="outline">{o.priority}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Critical Results
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">{criticalResults.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <TableSkeleton cols={1} rows={3} />
            ) : criticalResults.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="No critical results" className="border-0" />
            ) : (
              criticalResults.map((r) => (
                <div key={r.patient + r.test} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm font-medium">{r.patient}</p>
                  <p className="text-xs">{r.test}: <span className="font-semibold text-destructive">{r.result}</span> — <span className="text-destructive">{r.flag}</span></p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinanceDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const [todaysRevenue, setTodaysRevenue] = useState<number | null>(null);
  const [pendingBilling, setPendingBilling] = useState<
    Array<{ receipt: string; patient: string; amount: number; method: string }>
  >([]);
  const [nhifPending, setNhifPending] = useState<number | null>(null);
  const [transactionsToday, setTransactionsToday] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<{ method: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = startOfToday();
      const [
        { data: todayTx, error: todayError },
        { data: pendingRows, error: pendingError },
        { count: nhifCount },
      ] = await Promise.all([
        supabase.from("billing_transactions").select("amount, method").gte("created_at", since),
        supabase
          .from("billing_transactions")
          .select("receipt_no, patient_name, amount, method")
          .eq("status", "Pending")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("nhif_claims").select("id", { count: "exact", head: true }).eq("status", "Submitted"),
      ]);

      if (todayError) {
        console.error("Failed to load today's transactions:", todayError);
        setTodaysRevenue(0);
        setTransactionsToday(0);
        setRevenue([]);
      } else {
        const rows = todayTx ?? [];
        setTodaysRevenue(rows.reduce((sum, r) => sum + Number(r.amount), 0));
        setTransactionsToday(rows.length);
        const byMethod = new Map<string, number>();
        for (const r of rows) byMethod.set(r.method, (byMethod.get(r.method) ?? 0) + Number(r.amount));
        setRevenue(Array.from(byMethod.entries()).map(([method, amount]) => ({ method, amount })));
      }

      if (pendingError) {
        console.error("Failed to load pending billing:", pendingError);
        setPendingBilling([]);
      } else {
        setPendingBilling(
          (pendingRows ?? []).map((b) => ({
            receipt: b.receipt_no,
            patient: b.patient_name,
            amount: Number(b.amount),
            method: b.method,
          })),
        );
      }

      setNhifPending(nhifCount ?? 0);
      setLoading(false);
    };
    run();
  }, []);

  const stats: Stat[] = [
    { label: "Today's Revenue",     value: todaysRevenue === null ? "—" : `KES ${todaysRevenue.toLocaleString()}`, icon: Receipt, tone: "primary" },
    { label: "Pending Payments",    value: String(pendingBilling.length), icon: Clock,       tone: "warning" },
    { label: "NHIF Claims Pending", value: nhifPending === null ? "—" : String(nhifPending), icon: AlertTriangle, tone: "accent" },
    { label: "Transactions Today",  value: transactionsToday === null ? "—" : String(transactionsToday), icon: CheckCircle2, tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Good morning, {name}. Revenue and billing overview.</p>
      </div>
      <UserCredentialCard name={name} role="Finance Officer" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Payment Method (Today)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : revenue.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No transactions recorded today yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="method" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pending Payments</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton cols={4} rows={3} />
            ) : pendingBilling.length === 0 ? (
              <EmptyState icon={<Receipt className="h-6 w-6" />} title="No pending payments" className="border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Receipt</TableHead><TableHead>Patient</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBilling.map((b) => (
                    <TableRow key={b.receipt}>
                      <TableCell className="font-mono text-xs">{b.receipt}</TableCell>
                      <TableCell className="font-medium">{b.patient}</TableCell>
                      <TableCell>KES {b.amount.toLocaleString()}</TableCell>
                      <TableCell>{b.method}</TableCell>
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

// ── Root router ────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  // All user credentials come directly from the Supabase profile
  const props = {
    name:       user.name,
    email:      user.email,
    department: user.department,
    facility:   user.facility,
    phone:      user.phone,
    initials:   user.initials,
  };

function DoctorDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const [queue, setQueue] = useState<
    Array<{ queueNo: string; patient: string; patientId: string | null; triage: Triage; wait: string; status: string }>
  >([]);
  const [criticalResults, setCriticalResults] = useState<
    Array<{ patient: string; test: string; result: string }>
  >([]);
  const [prescriptionsToday, setPrescriptionsToday] = useState<number | null>(null);
  const [diagnosesToday, setDiagnosesToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const since = startOfToday();
      const [
        { data: queueRows, error: queueError },
        { data: critRows, error: critError },
        { count: rxCount },
        { count: dxCount },
      ] = await Promise.all([
        supabase
          .from("opd_queue")
          .select("queue_no, patient_name, patient_id, check_in_time, triage, status")
          .neq("status", "Done")
          .order("check_in_time", { ascending: true })
          .limit(6),
        supabase
          .from("lab_results")
          .select("test_name, result, lab_orders(patient_name)")
          .eq("is_critical", true)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("prescriptions").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("diagnoses").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);

      if (queueError) {
        console.error("Failed to load queue:", queueError);
        setQueue([]);
      } else {
        setQueue(
          (queueRows ?? []).map((q) => ({
            queueNo: q.queue_no,
            patient: q.patient_name,
            patientId: q.patient_id ?? null,
            triage: q.triage,
            wait: fmtWait(q.check_in_time),
            status: q.status,
          })),
        );
      }

      if (critError) {
        console.error("Failed to load critical results:", critError);
        setCriticalResults([]);
      } else {
        type CritJoinRow = { test_name: string; result: string; lab_orders: { patient_name: string } | null };
        const rows = (critRows ?? []) as unknown as CritJoinRow[];
        setCriticalResults(
          rows.map((r) => ({
            patient: r.lab_orders?.patient_name ?? "—",
            test: r.test_name,
            result: r.result,
          })),
        );
      }

      setPrescriptionsToday(rxCount ?? 0);
      setDiagnosesToday(dxCount ?? 0);
      setLoading(false);
    };
    run();
  }, []);

  const stats: Stat[] = [
    { label: "OPD Waiting",          value: String(queue.length),                                     icon: ListOrdered,  tone: "primary" },
    { label: "Critical Lab Results", value: String(criticalResults.length),                           icon: FlaskConical, tone: "warning" },
    { label: "Diagnoses Today",      value: diagnosesToday === null ? "—" : String(diagnosesToday),   icon: Activity,     tone: "primary" },
    { label: "Prescriptions Today",  value: prescriptionsToday === null ? "—" : String(prescriptionsToday), icon: Pill, tone: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Doctor Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Good morning, Dr. {name.split(" ")[0]}. Your clinical workspace for today.
        </p>
      </div>
      <UserCredentialCard name={name} role="Doctor" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">OPD Queue</CardTitle>
            <Link to="/clinical" className="text-xs text-primary underline-offset-2 hover:underline">
              Open Clinical Workspace →
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton cols={4} rows={4} />
            ) : queue.length === 0 ? (
              <EmptyState icon={<ListOrdered className="h-6 w-6" />} title="Queue is empty" className="border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Triage</TableHead>
                    <TableHead>Wait</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((q) => (
                    <TableRow key={q.queueNo}>
                      <TableCell className="font-mono text-xs">{q.queueNo}</TableCell>
                      <TableCell className="font-medium">
                        {q.patientId ? (
                          <Link
                            to="/clinical/$patientId"
                            params={{ patientId: q.patientId }}
                            className="text-primary hover:underline underline-offset-2"
                          >
                            {q.patient}
                          </Link>
                        ) : (
                          q.patient
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          q.triage === "Red" ? "border-red-500/30 bg-red-500/10 text-red-700"
                          : q.triage === "Orange" ? "border-orange-500/30 bg-orange-500/10 text-orange-700"
                          : ""
                        }>
                          {q.triage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{q.wait}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Critical Lab Results
              {criticalResults.length > 0 && (
                <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                  {criticalResults.length} critical
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <TableSkeleton cols={1} rows={3} />
            ) : criticalResults.length === 0 ? (
              <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No critical results" className="border-0" />
            ) : (
              criticalResults.map((r) => (
                <div key={r.patient + r.test} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm font-medium">{r.patient}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.test}: <span className="font-semibold text-destructive">{r.result}</span>
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


    case "Admin":          return <AdminDashboard      {...props} />;
    case "Clinician":      return <ClinicianDashboard  {...props} />;
    case "Doctor":         return <DoctorDashboard     {...props} />;
    case "Nurse":          return <NurseDashboard       {...props} />;
    case "Pharmacist":     return <PharmacistDashboard  {...props} />;
    case "Lab Technician": return <LabDashboard          {...props} />;
    case "Finance Officer":return <FinanceDashboard      {...props} />;
    default:
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">No dashboard available for your role.</p>
        </div>
      );
  }
}
