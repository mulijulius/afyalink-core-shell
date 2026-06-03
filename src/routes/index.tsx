import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  ListOrdered,
  BedDouble,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AfyaLink HMS" },
      {
        name: "description",
        content: "Clinical dashboard for Kenyatta County Hospital.",
      },
    ],
  }),
  component: Dashboard,
});

type Stat = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "warning";
};

const stats: Stat[] = [
  { label: "Patients Today", value: "142", icon: Users, tone: "primary" },
  { label: "Currently Waiting (OPD)", value: "23", icon: ListOrdered, tone: "primary" },
  { label: "Beds Occupied", value: "67/80", hint: "84% capacity", icon: BedDouble, tone: "accent" },
  { label: "Drug Stock Alerts", value: "4", icon: AlertTriangle, tone: "warning" },
];

const visits = [
  { day: "Mon", visits: 118 },
  { day: "Tue", visits: 134 },
  { day: "Wed", visits: 156 },
  { day: "Thu", visits: 142 },
  { day: "Fri", visits: 168 },
  { day: "Sat", visits: 96 },
  { day: "Sun", visits: 72 },
];

const diagnoses = [
  { name: "Malaria", cases: 248 },
  { name: "URI", cases: 187 },
  { name: "Hypertension", cases: 142 },
  { name: "Diabetes", cases: 98 },
  { name: "Typhoid", cases: 76 },
];

const recentPatients = [
  { name: "Wanjiku Kamau", id: "29384756", time: "09:42", dept: "OPD", status: "In Consult" },
  { name: "Brian Otieno", id: "31827465", time: "09:31", dept: "Pharmacy", status: "Dispensing" },
  { name: "Aisha Mohamed", id: "27645839", time: "09:18", dept: "Laboratory", status: "Awaiting Results" },
  { name: "Joseph Kiprono", id: "33928174", time: "09:05", dept: "OPD", status: "Waiting" },
  { name: "Faith Achieng", id: "30192847", time: "08:52", dept: "Maternity", status: "Admitted" },
];

const lowStock = [
  { name: "Artemether-Lumefantrine 20/120mg", qty: 24, unit: "packs" },
  { name: "Amoxicillin 500mg", qty: 18, unit: "strips" },
  { name: "Paracetamol 500mg", qty: 42, unit: "tabs" },
  { name: "Metformin 500mg", qty: 15, unit: "strips" },
];

const statusVariant: Record<string, string> = {
  "In Consult": "bg-primary/10 text-primary border-primary/20",
  Dispensing: "bg-accent/10 text-accent border-accent/30",
  "Awaiting Results": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  Waiting: "bg-muted text-muted-foreground border-border",
  Admitted: "bg-accent/10 text-accent border-accent/30",
};

function StatCard({ stat }: { stat: Stat }) {
  const toneClass =
    stat.tone === "warning"
      ? "bg-destructive/10 text-destructive"
      : stat.tone === "accent"
        ? "bg-accent/10 text-accent"
        : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {stat.label}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
          <stat.icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
        {stat.hint && (
          <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, Dr. Mwangi. Here's today's facility snapshot.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient Visits This Week</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visits} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-primary)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Diagnoses This Month</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnoses} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="cases" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>National ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPatients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.id}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.time}</TableCell>
                      <TableCell>{p.dept}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusVariant[p.status] ?? ""}
                        >
                          {p.status}
                        </Badge>
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
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
              {lowStock.length} items
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.map((d) => (
              <div
                key={d.name}
                className="flex items-start justify-between gap-3 rounded-md border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.qty} {d.unit} remaining
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" /> Low
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
