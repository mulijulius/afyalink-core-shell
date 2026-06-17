import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, ListOrdered, BedDouble, AlertTriangle,
  FlaskConical, Pill, Receipt, Share2, Clock,
  CheckCircle2, Building2, Phone, Mail, Shield,
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AfyaLink HMS" },
      { name: "description", content: "Clinical dashboard for Kapsabet Referral Hospital." },
    ],
  }),
  component: Dashboard,
});

// ── Shared static mock data (replace with Supabase queries in next phase) ──
const weekVisits = [
  { day: "Mon", visits: 118 }, { day: "Tue", visits: 134 },
  { day: "Wed", visits: 156 }, { day: "Thu", visits: 142 },
  { day: "Fri", visits: 168 }, { day: "Sat", visits: 96 },
  { day: "Sun", visits: 72 },
];
const diagnoses = [
  { name: "Malaria", cases: 248 }, { name: "URI", cases: 187 },
  { name: "Hypertension", cases: 142 }, { name: "Diabetes", cases: 98 },
  { name: "Typhoid", cases: 76 },
];
const recentPatients = [
  { name: "Wanjiku Kamau",  id: "29384756", time: "09:42", dept: "OPD",        status: "In Consult" },
  { name: "Brian Otieno",   id: "31827465", time: "09:31", dept: "Pharmacy",   status: "Dispensing" },
  { name: "Aisha Mohamed",  id: "27645839", time: "09:18", dept: "Laboratory", status: "Awaiting Results" },
  { name: "Joseph Kiprono", id: "33928174", time: "09:05", dept: "OPD",        status: "Waiting" },
  { name: "Faith Achieng",  id: "30192847", time: "08:52", dept: "Maternity",  status: "Admitted" },
];
const lowStock = [
  { name: "Artemether-Lumefantrine 20/120mg", qty: 24, unit: "packs" },
  { name: "Amoxicillin 500mg",                qty: 18, unit: "strips" },
  { name: "Paracetamol 500mg",                qty: 42, unit: "tabs" },
  { name: "Metformin 500mg",                  qty: 15, unit: "strips" },
];
const myQueue = [
  { queueNo: "A012", patient: "Wanjiku Kamau",  triage: "Yellow", wait: "38m", status: "In Consult" },
  { queueNo: "A015", patient: "Joseph Kiprono", triage: "Orange", wait: "22m", status: "Waiting" },
  { queueNo: "A018", patient: "Mercy Wairimu",  triage: "Green",  wait: "9m",  status: "Waiting" },
];
const criticalResults = [
  { patient: "Joseph Kiprono", test: "Blood Glucose (Fasting)", result: "22.4 mmol/L", flag: "High" },
  { patient: "Wanjiku Kamau",  test: "Hemoglobin",              result: "9.2 g/dL",    flag: "Low" },
];
const pendingPrescriptions = [
  { patient: "Wanjiku Kamau",  drug: "Amlodipine 5mg",                   dose: "5mg OD",   qty: "30 tabs" },
  { patient: "Brian Otieno",   drug: "Artemether-Lumefantrine 20/120mg", dose: "4 tabs BD", qty: "1 pack" },
  { patient: "Joseph Kiprono", drug: "Metformin 500mg",                  dose: "500mg BD", qty: "60 tabs" },
];
const pendingLabOrders = [
  { id: "LAB-2041", patient: "Wanjiku Kamau", tests: ["Full Blood Count","Lipid Profile"], priority: "Routine", status: "Processing" },
  { id: "LAB-2044", patient: "Aisha Mohamed", tests: ["Urinalysis","HIV Rapid Test"],     priority: "Routine", status: "Collected" },
  { id: "LAB-2045", patient: "David Mutua",   tests: ["Widal Test"],                       priority: "Urgent",  status: "Pending" },
];
const revenue = [
  { method: "M-Pesa", amount: 42500 }, { method: "NHIF", amount: 31200 },
  { method: "Cash",   amount: 14800 }, { method: "Insurance", amount: 9600 },
];
const pendingBilling = [
  { receipt: "RCP-10238", patient: "Joseph Kiprono", amount: 3400, method: "NHIF" },
  { receipt: "RCP-10234", patient: "David Mutua",    amount: 2100, method: "M-Pesa" },
];

const STATUS_CLASS: Record<string, string> = {
  "In Consult":       "bg-primary/10 text-primary border-primary/20",
  Dispensing:         "bg-accent/10 text-accent border-accent/30",
  "Awaiting Results": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  Waiting:            "bg-muted text-muted-foreground border-border",
  Admitted:           "bg-accent/10 text-accent border-accent/30",
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

// ── Role dashboards ────────────────────────────────────────────

function AdminDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const [lowStockItems, setLowStockItems] = useState<Array<{ name: string; qty: number; unit: string }>>([]);

  useEffect(() => {
    const fetchLowStock = async () => {
      const { data } = await supabase
        .from("pharmacy_drugs")
        .select("name, stock, unit, reorder_level");
      const low = (data ?? [])
        .filter((d) => d.stock < d.reorder_level)
        .map((d) => ({ name: d.name, qty: d.stock, unit: d.unit }))
        .slice(0, 4);
      setLowStockItems(low);
    };
    fetchLowStock();
  }, []);

  const stats: Stat[] = [
    { label: "Patients Today",          value: "142",   icon: Users,         tone: "primary" },
    { label: "Currently Waiting (OPD)", value: "23",    icon: ListOrdered,   tone: "primary" },
    { label: "Beds Occupied",           value: "67/80", hint: "84% capacity", icon: BedDouble, tone: "accent" },
    { label: "Drug Stock Alerts",       value: String(lowStockItems.length),     icon: AlertTriangle, tone: "warning" },
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top 5 Diagnoses This Month</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnoses} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="cases" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Patients</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>National ID</TableHead>
                    <TableHead>Time</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPatients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">{lowStockItems.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockItems.map((d) => (
              <div key={d.name} className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.qty} {d.unit} remaining</p>
                </div>
                <Badge variant="outline" className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />Low
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClinicianDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const stats: Stat[] = [
    { label: "My Queue Today",      value: String(myQueue.length),          icon: ListOrdered,   tone: "primary" },
    { label: "Awaiting My Review",  value: "2",                             icon: Clock,         tone: "accent" },
    { label: "Critical Lab Results",value: String(criticalResults.length),  icon: FlaskConical,  tone: "warning" },
    { label: "Referrals Sent",      value: "3",                             icon: Share2,        tone: "primary" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Good morning, {name}. Your clinical workload for today.</p>
      </div>
      <UserCredentialCard name={name} role="Clinician" email={email} department={department} facility={facility} phone={phone} initials={initials} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">My OPD Queue</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Queue #</TableHead><TableHead>Patient</TableHead><TableHead>Triage</TableHead><TableHead>Wait</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {myQueue.map((q) => (
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
            {criticalResults.map((r) => (
              <div key={r.patient + r.test} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm font-medium">{r.patient}</p>
                <p className="text-xs text-muted-foreground">{r.test}: <span className="font-semibold text-destructive">{r.result}</span></p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NurseDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const stats: Stat[] = [
    { label: "Waiting in OPD",  value: "5",  icon: ListOrdered,  tone: "primary" },
    { label: "Triaged Today",   value: "14", icon: CheckCircle2, tone: "accent" },
    { label: "Red Triage",      value: "1",  icon: AlertTriangle, tone: "warning" },
    { label: "Total Check-ins", value: "23", icon: Users,         tone: "primary" },
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
          <Table>
            <TableHeader>
              <TableRow><TableHead>Queue #</TableHead><TableHead>Patient</TableHead><TableHead>Triage</TableHead><TableHead>Wait</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {myQueue.map((q) => (
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
        </CardContent>
      </Card>
    </div>
  );
}

function PharmacistDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const [lowStockItems, setLowStockItems] = useState<Array<{ name: string; qty: number; unit: string }>>([]);

  useEffect(() => {
    const fetchLowStock = async () => {
      const { data } = await supabase
        .from("pharmacy_drugs")
        .select("name, stock, unit, reorder_level");
      const low = (data ?? [])
        .filter((d) => d.stock < d.reorder_level)
        .map((d) => ({ name: d.name, qty: d.stock, unit: d.unit }))
        .slice(0, 4);
      setLowStockItems(low);
    };
    fetchLowStock();
  }, []);

  const stats: Stat[] = [
    { label: "Prescriptions to Dispense", value: String(pendingPrescriptions.length), icon: Pill,          tone: "primary" },
    { label: "Out of Stock",              value: "1",                                  icon: AlertTriangle, tone: "warning" },
    { label: "Low Stock Items",           value: String(lowStockItems.length),              icon: AlertTriangle, tone: "accent" },
    { label: "Dispensed Today",           value: "18",                                 icon: CheckCircle2,  tone: "primary" },
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
            <Table>
              <TableHeader>
                <TableRow><TableHead>Patient</TableHead><TableHead>Drug</TableHead><TableHead>Dose</TableHead><TableHead>Qty</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {pendingPrescriptions.map((p) => (
                  <TableRow key={p.patient + p.drug}>
                    <TableCell className="font-medium">{p.patient}</TableCell>
                    <TableCell className="text-sm">{p.drug}</TableCell>
                    <TableCell className="text-muted-foreground">{p.dose}</TableCell>
                    <TableCell>{p.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">{lowStockItems.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockItems.map((d) => (
              <div key={d.name} className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.qty} {d.unit} remaining</p>
                </div>
                <Badge variant="outline" className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />Low
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LabDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const pending = pendingLabOrders.filter((o) => o.status === "Pending").length;
  const processing = pendingLabOrders.filter((o) => o.status === "Processing").length;
  const stats: Stat[] = [
    { label: "Pending Orders",   value: String(pending),                    icon: FlaskConical, tone: "primary" },
    { label: "Processing",       value: String(processing),                 icon: Clock,        tone: "accent" },
    { label: "Critical Results", value: String(criticalResults.length),     icon: AlertTriangle, tone: "warning" },
    { label: "Completed Today",  value: "4",                                icon: CheckCircle2, tone: "primary" },
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
            <Table>
              <TableHeader>
                <TableRow><TableHead>Order #</TableHead><TableHead>Patient</TableHead><TableHead>Tests</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {pendingLabOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell className="font-medium">{o.patient}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.tests.join(", ")}</TableCell>
                    <TableCell><Badge variant="outline">{o.priority}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            {criticalResults.map((r) => (
              <div key={r.patient + r.test} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm font-medium">{r.patient}</p>
                <p className="text-xs">{r.test}: <span className="font-semibold text-destructive">{r.result}</span> — <span className="text-destructive">{r.flag}</span></p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinanceDashboard({ name, email, department, facility, phone, initials }: {
  name: string; email: string; department: string | null; facility: string; phone: string | null; initials: string;
}) {
  const stats: Stat[] = [
    { label: "Today's Revenue",     value: "KES 98,100",               icon: Receipt,       tone: "primary" },
    { label: "Pending Payments",    value: String(pendingBilling.length), icon: Clock,       tone: "warning" },
    { label: "NHIF Claims Pending", value: "2",                         icon: AlertTriangle, tone: "accent" },
    { label: "Transactions Today",  value: "34",                        icon: CheckCircle2,  tone: "primary" },
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
          <CardHeader><CardTitle className="text-base">Revenue by Payment Method</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="method" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="amount" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pending Payments</CardTitle></CardHeader>
          <CardContent>
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

  switch (user.role) {
    case "Admin":          return <AdminDashboard      {...props} />;
    case "Clinician":      return <ClinicianDashboard  {...props} />;
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
