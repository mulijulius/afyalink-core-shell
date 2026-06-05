import { useState } from "react";
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
import {
  dailyVisits, departmentBreakdown, revenueByMethod, topDiagnoses,
  surveillance, mohReports, counties, type AlertLevel, type Report,
} from "@/data/analytics";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

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

/* ---------------- TAB 1 ---------------- */

function FacilityAnalytics() {
  const [range, setRange] = useState("week");

  const kpis = [
    { label: "Total Visits",    value: "1,088",  icon: Activity,  tint: "text-[#0057A8]" },
    { label: "New Patients",    value: "184",    icon: Users,     tint: "text-[#00A651]" },
    { label: "Revenue (KES)",   value: "981,000",icon: Wallet,    tint: "text-amber-600" },
    { label: "Avg Wait Time",   value: "27 min", icon: Clock,     tint: "text-sky-600" },
    { label: "Bed Occupancy",   value: "78%",    icon: BedDouble, tint: "text-rose-600" },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Facility Overview</h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="custom">Custom Range…</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={cn("h-4 w-4", k.tint)} />
              </div>
              <div className="mt-2 text-2xl font-semibold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Patient Visits</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyVisits}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="visits" stroke="#0057A8" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Patients by Department</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                  {departmentBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue by Payment Method (KES)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMethod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="method" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#00A651" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top 10 Diagnoses — This Month</CardTitle></CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </>
  );
}

/* ---------------- TAB 2 ---------------- */

const levelClass = (l: AlertLevel) =>
  l === "Alert" ? "bg-red-100 text-red-700 border-red-200"
  : l === "Watch" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-emerald-100 text-emerald-700 border-emerald-200";

function Surveillance() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0057A8]" />
            County Heatmap — DHIS2 Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-72 rounded-md border border-dashed bg-gradient-to-br from-sky-50 to-emerald-50 overflow-hidden">
            <svg viewBox="0 0 400 240" className="absolute inset-0 w-full h-full">
              <rect x="10" y="10" width="380" height="220" fill="none" stroke="#94a3b8" strokeDasharray="4 4" />
              {counties.map((c, i) => {
                const x = 40 + (i % 4) * 90;
                const y = 50 + Math.floor(i / 4) * 80;
                const intensity = Math.min(1, c.cases / 150);
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
          <p className="mt-2 text-xs text-muted-foreground">
            Placeholder visualization — live county-level heatmap streams from DHIS2.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notifiable Disease Trends</CardTitle></CardHeader>
        <CardContent>
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
              {surveillance.map((s) => {
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
        </CardContent>
      </Card>
    </>
  );
}

/* ---------------- TAB 3 ---------------- */

type ReportState = "idle" | "loading" | "ready";

function MohReports() {
  const [state, setState] = useState<Record<string, ReportState>>({});

  const run = (id: string) => {
    setState((s) => ({ ...s, [id]: "loading" }));
    setTimeout(() => setState((s) => ({ ...s, [id]: "ready" })), 1400);
  };

  return (
    <div className="space-y-3">
      {mohReports.map((r: Report) => {
        const st = state[r.id] ?? "idle";
        return (
          <Card key={r.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-md bg-[#0057A8]/10 text-[#0057A8] flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.description} · Last generated {r.lastGenerated}
                </div>
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
