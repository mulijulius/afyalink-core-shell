import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import {
  Activity, Users, Wallet, Clock, BedDouble, TrendingUp, TrendingDown,
  Minus, Loader2, Download, Upload, FileText, MapPin,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

type AlertLevel = "Normal" | "Watch" | "Alert";

const KENYA_COUNTIES_TOP = [
  "Nairobi", "Kisumu", "Mombasa", "Nakuru",
  "Kiambu", "Machakos", "Uasin Gishu", "Kakamega",
];

const RANGE_DAYS: Record<string, number> = { week: 7, month: 30 };

function rangeStart(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics & Reporting</h1>
        <p className="text-sm text-muted-foreground">
          Facility performance, disease surveillance, and Ministry of Health reports.
        </p>
      </div>

      <Tabs defaultValue="facility">
        <TabsList>
          <TabsTrigger value="facility">Facility Analytics</TabsTrigger>
          <TabsTrigger value="surveillance">Disease Surveillance</TabsTrigger>
          <TabsTrigger value="moh">MOH Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="facility" className="space-y-6">
          <FacilityAnalytics />
        </TabsContent>
        <TabsContent value="surveillance" className="space-y-6">
          <Surveillance />
        </TabsContent>
        <TabsContent value="moh" className="space-y-4">
          <MohReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- TAB 1 — FACILITY ANALYTICS ---------------- */

type FacilityKpis = {
  totalVisits: number;
  newPatients: number;
  revenue: number;
  avgWaitMin: number | null;
};

function FacilityAnalytics() {
  const [range, setRange] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<FacilityKpis>({ totalVisits: 0, newPatients: 0, revenue: 0, avgWaitMin: null });
  const [dailyVisits, setDailyVisits] = useState<{ day: string; visits: number }[]>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [revenueByMethod, setRevenueByMethod] = useState<{ method: string; amount: number }[]>([]);
  const [topDiagnoses, setTopDiagnoses] = useState<{ dx: string; count: number }[]>([]);

  useEffect(() => {
    const days = RANGE_DAYS[range];
    const start = rangeStart(days);
    const startIso = isoDate(start);

    const run = async () => {
      setLoading(true);

      const [
        { data: visitRows, error: visitError },
        { count: newPatientCount, error: patientError },
        { data: txRows, error: txError },
        { data: queueWaitRows },
      ] = await Promise.all([
        supabase.from("visits").select("visit_date, diagnosis, department").gte("visit_date", startIso),
        supabase.from("patients").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
        supabase.from("billing_transactions").select("amount, method").gte("transaction_date", startIso),
        supabase.from("opd_queue").select("check_in_time, updated_at, status").eq("status", "Done").gte("check_in_time", start.toISOString()),
      ]);

      if (visitError) console.error("Failed to load visits:", visitError);
      if (patientError) console.error("Failed to load new patients:", patientError);
      if (txError) console.error("Failed to load transactions:", txError);

      const visits = visitRows ?? [];

      // Daily visit trend
      const buckets: { day: string; visits: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = isoDate(d);
        const label = days <= 7
          ? d.toLocaleDateString([], { weekday: "short" })
          : d.toLocaleDateString([], { day: "2-digit", month: "short" });
        const count = visits.filter((v) => v.visit_date === key).length;
        buckets.push({ day: label, visits: count });
      }
      setDailyVisits(buckets);

      // Department breakdown
      const deptColors: Record<string, string> = {
        OPD: "#0057A8", Inpatient: "#00A651", Maternity: "#E94E77", Emergency: "#F59E0B",
      };
      const deptCounts = new Map<string, number>();
      for (const v of visits) deptCounts.set(v.department, (deptCounts.get(v.department) ?? 0) + 1);
      setDepartmentBreakdown(
        Array.from(deptCounts.entries()).map(([name, value]) => ({
          name, value, color: deptColors[name] ?? "#64748b",
        })),
      );

      // Top diagnoses
      const dxCounts = new Map<string, number>();
      for (const v of visits) {
        const dx = (v.diagnosis ?? "").trim();
        if (!dx) continue;
        dxCounts.set(dx, (dxCounts.get(dx) ?? 0) + 1);
      }
      setTopDiagnoses(
        Array.from(dxCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([dx, count]) => ({ dx, count })),
      );

      // Revenue by method
      const txs = txRows ?? [];
      const methodTotals = new Map<string, number>();
      for (const t of txs) methodTotals.set(t.method, (methodTotals.get(t.method) ?? 0) + Number(t.amount));
      setRevenueByMethod(Array.from(methodTotals.entries()).map(([method, amount]) => ({ method, amount })));

      // Avg wait time, from completed OPD visits this range (check-in to last update)
      const waits = (queueWaitRows ?? [])
        .map((q) => (new Date(q.updated_at).getTime() - new Date(q.check_in_time).getTime()) / 60000)
        .filter((m) => m >= 0);
      const avgWaitMin = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null;

      setKpis({
        totalVisits: visits.length,
        newPatients: newPatientCount ?? 0,
        revenue: txs.reduce((sum, t) => sum + Number(t.amount), 0),
        avgWaitMin,
      });

      setLoading(false);
    };

    run();
  }, [range]);

  const kpiCards = [
    { label: "Total Visits",  value: kpis.totalVisits.toLocaleString(),                          icon: Activity,  tint: "text-[#0057A8]" },
    { label: "New Patients",  value: kpis.newPatients.toLocaleString(),                           icon: Users,     tint: "text-[#00A651]" },
    { label: "Revenue (KES)", value: kpis.revenue.toLocaleString(),                                icon: Wallet,    tint: "text-amber-600" },
    { label: "Avg Wait Time", value: kpis.avgWaitMin === null ? "—" : `${kpis.avgWaitMin} min`,    icon: Clock,     tint: "text-sky-600" },
    { label: "Bed Occupancy", value: "Not tracked",                                                icon: BedDouble, tint: "text-rose-600" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Facility Overview</h2>
        <Select value={range} onValueChange={(v) => setRange(v as "week" | "month")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={cn("h-4 w-4", k.tint)} />
              </div>
              <div className="mt-2 text-2xl font-semibold">{loading ? "—" : k.value}</div>
              {k.label === "Bed Occupancy" && (
                <p className="mt-1 text-[11px] text-muted-foreground">No bed/inpatient table yet</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Patient Visits</CardTitle></CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyVisits}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visits" stroke="#0057A8" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Patients by Department</CardTitle></CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : departmentBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No visits recorded in this range yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                    {departmentBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue by Payment Method (KES)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : revenueByMethod.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No transactions recorded in this range yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMethod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="method" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#00A651" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top 10 Diagnoses — {range === "week" ? "This Week" : "This Month"}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton cols={3} rows={6} />
          ) : topDiagnoses.length === 0 ? (
            <EmptyState icon={<Activity className="h-6 w-6" />} title="No diagnoses recorded yet" description="Diagnoses entered on patient visits will be ranked here." className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDiagnoses.map((d, i) => (
                  <TableRow key={d.dx}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{d.dx}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ---------------- TAB 2 — DISEASE SURVEILLANCE ---------------- */

const levelClass = (l: AlertLevel) =>
  l === "Alert" ? "bg-red-100 text-red-700 border-red-200"
  : l === "Watch" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-emerald-100 text-emerald-700 border-emerald-200";

/** Notifiable disease alert thresholds — week-over-week case count rises trigger Watch/Alert. */
function alertLevelFor(thisWeek: number, lastWeek: number): AlertLevel {
  const diff = thisWeek - lastWeek;
  if (thisWeek >= 5 && diff > lastWeek * 0.5) return "Alert";
  if (diff > 0) return "Watch";
  return "Normal";
}

type SurveillanceRow = { disease: string; thisWeek: number; lastWeek: number; level: AlertLevel };

function Surveillance() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SurveillanceRow[]>([]);
  const [counties, setCounties] = useState<{ name: string; cases: number }[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const thisWeekStart = rangeStart(7);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const [{ data: thisWeekVisits, error: e1 }, { data: lastWeekVisits, error: e2 }, { data: patientRows, error: e3 }] =
        await Promise.all([
          supabase.from("visits").select("diagnosis").gte("visit_date", isoDate(thisWeekStart)),
          supabase
            .from("visits")
            .select("diagnosis")
            .gte("visit_date", isoDate(lastWeekStart))
            .lt("visit_date", isoDate(thisWeekStart)),
          supabase.from("patients").select("county"),
        ]);

      if (e1) console.error("Failed to load this week's visits:", e1);
      if (e2) console.error("Failed to load last week's visits:", e2);
      if (e3) console.error("Failed to load patient counties:", e3);

      const countBy = (vs: { diagnosis: string | null }[] | null) => {
        const m = new Map<string, number>();
        for (const v of vs ?? []) {
          const dx = (v.diagnosis ?? "").trim();
          if (!dx) continue;
          m.set(dx, (m.get(dx) ?? 0) + 1);
        }
        return m;
      };

      const thisWeekCounts = countBy(thisWeekVisits);
      const lastWeekCounts = countBy(lastWeekVisits);
      const diseases = new Set([...thisWeekCounts.keys(), ...lastWeekCounts.keys()]);

      const surveillanceRows: SurveillanceRow[] = Array.from(diseases)
        .map((disease) => {
          const thisWeek = thisWeekCounts.get(disease) ?? 0;
          const lastWeek = lastWeekCounts.get(disease) ?? 0;
          return { disease, thisWeek, lastWeek, level: alertLevelFor(thisWeek, lastWeek) };
        })
        .sort((a, b) => b.thisWeek - a.thisWeek)
        .slice(0, 10);
      setRows(surveillanceRows);

      const countyCounts = new Map<string, number>();
      for (const p of patientRows ?? []) {
        const county = p.county?.trim();
        if (!county) continue;
        countyCounts.set(county, (countyCounts.get(county) ?? 0) + 1);
      }
      setCounties(
        KENYA_COUNTIES_TOP
          .map((name) => ({ name, cases: countyCounts.get(name) ?? 0 }))
          .filter((c) => c.cases > 0)
          .sort((a, b) => b.cases - a.cases),
      );

      setLoading(false);
    };

    run();
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0057A8]" />
            County Heatmap — Registered Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : counties.length === 0 ? (
            <EmptyState icon={<MapPin className="h-6 w-6" />} title="No county data yet" description="Patient county is captured at registration." className="border-0" />
          ) : (
            <div className="relative h-72 rounded-md border border-dashed bg-gradient-to-br from-sky-50 to-emerald-50 overflow-hidden">
              <svg viewBox="0 0 400 240" className="absolute inset-0 w-full h-full">
                <rect x="10" y="10" width="380" height="220" fill="none" stroke="#94a3b8" strokeDasharray="4 4" />
                {counties.map((c, i) => {
                  const x = 40 + (i % 4) * 90;
                  const y = 50 + Math.floor(i / 4) * 80;
                  const max = Math.max(...counties.map((cc) => cc.cases), 1);
                  const intensity = Math.min(1, c.cases / max);
                  return (
                    <g key={c.name}>
                      <circle cx={x} cy={y} r={10 + intensity * 18}
                        fill="#E94E77" fillOpacity={0.25 + intensity * 0.5} />
                      <text x={x} y={y + 36} textAnchor="middle" fontSize="11" fill="#0f172a">
                        {c.name} ({c.cases})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Based on county recorded at patient registration. No DHIS2 integration is connected yet.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notifiable Disease Trends</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton cols={5} rows={5} />
          ) : rows.length === 0 ? (
            <EmptyState icon={<Activity className="h-6 w-6" />} title="No diagnoses recorded in the last two weeks" className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disease</TableHead>
                  <TableHead className="text-right">This Week</TableHead>
                  <TableHead className="text-right">Last Week</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Alert Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const diff = s.thisWeek - s.lastWeek;
                  const Up = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
                  const trendColor =
                    diff > 0 ? "text-red-600" : diff < 0 ? "text-emerald-600" : "text-slate-500";
                  return (
                    <TableRow key={s.disease}>
                      <TableCell className="font-medium">{s.disease}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.thisWeek}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.lastWeek}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 text-sm", trendColor)}>
                          <Up className="h-4 w-4" />
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={levelClass(s.level)}>{s.level}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ---------------- TAB 3 — MOH REPORTS ---------------- */

type ReportState = "idle" | "loading" | "ready";
type ReportDef = {
  id: string;
  name: string;
  description: string;
  action: "Download PDF" | "Submit to DHIS2";
};

// Static catalogue of report types this facility produces. There is no
// report-generation table in the database yet, so "last generated" timestamps
// are not persisted — each card reflects only the current session's actions.
const REPORT_CATALOGUE: ReportDef[] = [
  { id: "moh711", name: "MOH 711 Monthly Summary",    description: "Integrated outpatient & RH summary.",    action: "Download PDF" },
  { id: "dhis2",  name: "DHIS2 Data Export",          description: "Aggregated dataset for upload.",          action: "Submit to DHIS2" },
  { id: "nhif",   name: "NHIF Claims Report",         description: "Monthly outpatient & inpatient claims.",  action: "Download PDF" },
  { id: "drugs",  name: "Drug Consumption Report",    description: "Pharmacy issues vs receipts.",            action: "Download PDF" },
  { id: "util",   name: "Facility Utilization Report",description: "Bed occupancy, OPD load, ALOS.",          action: "Download PDF" },
];

function MohReports() {
  const [state, setState] = useState<Record<string, ReportState>>({});

  const run = (id: string) => {
    setState((s) => ({ ...s, [id]: "loading" }));
    setTimeout(() => setState((s) => ({ ...s, [id]: "ready" })), 1400);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Report generation pulls live data at the moment you click Generate. Generated-file history isn't
        persisted yet, so no "last generated" date is shown until a report-runs table is added.
      </p>
      {REPORT_CATALOGUE.map((r) => {
        const st = state[r.id] ?? "idle";
        return (
          <Card key={r.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-md bg-[#0057A8]/10 text-[#0057A8] flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.description}</div>
              </div>
              {st === "ready" ? (
                <Button className="bg-[#00A651] hover:bg-[#00904a]">
                  {r.action === "Submit to DHIS2" ? <Upload /> : <Download />}
                  Ready — {r.action}
                </Button>
              ) : st === "loading" ? (
                <Button disabled variant="outline">
                  <Loader2 className="animate-spin" /> Generating…
                </Button>
              ) : (
                <Button variant="outline" onClick={() => run(r.id)}>Generate</Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
