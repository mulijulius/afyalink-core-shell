import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListOrdered, Pill, Receipt } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AfyaLink HMS" },
      { name: "description", content: "AfyaLink HMS dashboard for Kenyatta County Hospital." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Patients Today", value: "248", icon: Users },
  { label: "OPD Queue", value: "37", icon: ListOrdered },
  { label: "Pharmacy Orders", value: "112", icon: Pill },
  { label: "Pending Bills", value: "KSh 84,200", icon: Receipt },
];

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
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Modules will populate here as they come online.
        </CardContent>
      </Card>
    </div>
  );
}
