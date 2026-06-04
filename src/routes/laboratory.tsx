import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  LAB_TESTS, type LabOrder, type LabPriority, type LabResult,
  initialOrders, initialResults, sampleTracks, SAMPLE_STAGES, type SampleStage,
} from "@/data/laboratory";
import { patients } from "@/data/patients";

export const Route = createFileRoute("/laboratory")({
  component: LaboratoryPage,
});

const priorityClass = (p: LabPriority) =>
  p === "STAT" ? "bg-red-100 text-red-700 border-red-200"
  : p === "Urgent" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-slate-100 text-slate-700 border-slate-200";

const statusClass = (s: LabOrder["status"]) =>
  s === "Completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
  : s === "Processing" ? "bg-sky-100 text-sky-700 border-sky-200"
  : s === "Collected" ? "bg-indigo-100 text-indigo-700 border-indigo-200"
  : "bg-slate-100 text-slate-700 border-slate-200";

const flagClass = (f: LabResult["flag"]) =>
  f === "High" ? "bg-red-100 text-red-700 border-red-200"
  : f === "Low" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-emerald-100 text-emerald-700 border-emerald-200";

function NewOrderDialog({ onCreate }: { onCreate: (o: LabOrder) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[number] | null>(null);
  const [tests, setTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<LabPriority>("Routine");

  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.nationalId.includes(q)).slice(0, 5);
  }, [query]);

  const reset = () => { setQuery(""); setSelectedPatient(null); setTests([]); setPriority("Routine"); };

  const submit = () => {
    if (!selectedPatient || tests.length === 0) {
      toast.error("Select a patient and at least one test");
      return;
    }
    const id = `LAB-${2047 + Math.floor(Math.random() * 900)}`;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    onCreate({
      id,
      patientName: selectedPatient.name,
      nationalId: selectedPatient.nationalId,
      tests,
      orderedBy: "Dr. Mwangi",
      time,
      priority,
      status: "Pending",
    });
    toast.success(`Order ${id} created`);
    reset();
    setOpen(false);
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
                <p className="font-medium">{selectedPatient.name}</p>
                <p className="text-xs text-muted-foreground">ID: {selectedPatient.nationalId} • {selectedPatient.gender}, {selectedPatient.age}y</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Change</Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search by name or National ID" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {matches.length > 0 && (
                <div className="rounded-md border divide-y max-h-40 overflow-auto">
                  {matches.map((p) => (
                    <button key={p.id} onClick={() => setSelectedPatient(p)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
                      <span className="font-medium">{p.name}</span> <span className="text-muted-foreground">• {p.nationalId}</span>
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
          <Button className="bg-[#0057A8] hover:bg-[#0057A8]/90" onClick={submit}>Create Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LaboratoryPage() {
  const [orders, setOrders] = useState<LabOrder[]>(initialOrders);
  const results = initialResults;
  const criticals = results.filter(r => r.critical);

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
            <NewOrderDialog onCreate={(o) => setOrders((prev) => [o, ...prev])} />
          </div>
          <Card>
            <CardContent className="p-0">
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
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell className="font-medium">{o.patientName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[260px]">{o.tests.join(", ")}</TableCell>
                      <TableCell>{o.orderedBy}</TableCell>
                      <TableCell>{o.time}</TableCell>
                      <TableCell><Badge variant="outline" className={priorityClass(o.priority)}>{o.priority}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={statusClass(o.status)}>{o.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Cancel</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTS */}
        <TabsContent value="results" className="space-y-4">
          {criticals.map((c) => (
            <div key={c.orderId + c.test} className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <p className="text-sm font-medium">
                ⚠ Critical Value: Patient {c.patient} — {c.test.replace(/\s*\(.*\)/, "")} {c.result}
              </p>
            </div>
          ))}
          <Card>
            <CardContent className="p-0">
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
                  {results.map((r, i) => {
                    const abnormal = r.flag !== "Normal";
                    return (
                      <TableRow key={i} className={abnormal ? "bg-red-50/40" : ""}>
                        <TableCell className="font-mono text-xs">{r.orderId}</TableCell>
                        <TableCell className="font-medium">{r.patient}</TableCell>
                        <TableCell>{r.test}</TableCell>
                        <TableCell className={abnormal ? "font-semibold text-red-700" : ""}>{r.result}</TableCell>
                        <TableCell className="text-muted-foreground">{r.range}</TableCell>
                        <TableCell><Badge variant="outline" className={flagClass(r.flag)}>{r.flag}</Badge></TableCell>
                        <TableCell>{r.verifiedBy}</TableCell>
                        <TableCell>{r.time}</TableCell>
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
                            {s.stage as SampleStage}
                          </Badge>
                        </TableCell>
                        <TableCell>{s.updated}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
