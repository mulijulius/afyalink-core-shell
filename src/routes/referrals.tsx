import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, FileText, Printer, Search, Send, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECEIVING_FACILITIES, sampleReferrals, type ReferralStatus, type Urgency } from "@/data/referrals";
import { patients } from "@/data/patients";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/referrals")({
  component: ReferralsPage,
});

const DOCS = ["Lab Results", "Imaging", "Prescription", "Discharge Summary"] as const;

const urgencyClass = (u: Urgency) =>
  u === "Emergency" ? "bg-red-100 text-red-700 border-red-200"
  : u === "Urgent" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-slate-100 text-slate-700 border-slate-200";

const statusClass = (s: ReferralStatus) =>
  s === "Completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
  : s === "Received" ? "bg-sky-100 text-sky-700 border-sky-200"
  : s === "Pending" ? "bg-amber-100 text-amber-700 border-amber-200"
  : "bg-red-100 text-red-700 border-red-200";

function SendReferralForm() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<typeof patients[number] | null>(null);
  const [facility, setFacility] = useState<string>("");
  const [urgency, setUrgency] = useState<Urgency>("Routine");
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState("");
  const [docs, setDocs] = useState<string[]>(["Lab Results"]);
  const [transport, setTransport] = useState<"Self" | "Ambulance">("Self");
  const [pickup, setPickup] = useState("");
  const [contact, setContact] = useState("");
  const [preview, setPreview] = useState(false);

  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.nationalId.includes(q)).slice(0, 5);
  }, [query]);

  const choosePatient = (p: typeof patients[number]) => {
    setSelected(p);
    setQuery("");
    const last = p.visits[0];
    if (last) setSummary(`Last visit ${last.date}: ${last.diagnosis}. Attended by ${last.clinician}. Patient is a ${p.age}y ${p.gender.toLowerCase()} from ${p.county}, blood group ${p.bloodGroup}${p.allergies.length ? `, known allergies: ${p.allergies.join(", ")}` : ""}.`);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Referral Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Referring Facility</Label>
              <Input value="Kenyatta County Hospital" readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label>Receiving Facility</Label>
              <Select value={facility} onValueChange={setFacility}>
                <SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger>
                <SelectContent>
                  {RECEIVING_FACILITIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Patient</Label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border p-3 bg-muted/40">
                <div>
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {selected.nationalId} • {selected.gender}, {selected.age}y • {selected.phone}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setSummary(""); }}>Change</Button>
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
                      <button key={p.id} onClick={() => choosePatient(p)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
                        <span className="font-medium">{p.name}</span> <span className="text-muted-foreground">• {p.nationalId}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Urgency</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
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
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Cardiology review for resistant hypertension" />
          </div>

          <div className="space-y-1.5">
            <Label>Clinical Summary</Label>
            <Textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Auto-populates from patient's last visit" />
          </div>

          <div className="space-y-2">
            <Label>Accompanying Documents</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
              {DOCS.map((d) => {
                const checked = docs.includes(d);
                return (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={(v) => setDocs((prev) => v ? [...prev, d] : prev.filter(x => x !== d))} />
                    {d}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Transport</Label>
            <Select value={transport} onValueChange={(v) => setTransport(v as "Self" | "Ambulance")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Self">Self</SelectItem>
                <SelectItem value="Ambulance">Ambulance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transport === "Ambulance" && (
            <div className="grid md:grid-cols-2 gap-4 rounded-md border border-[#00A651]/30 bg-[#00A651]/5 p-4">
              <div className="space-y-1.5">
                <Label>Pickup Time</Label>
                <Input type="datetime-local" value={pickup} onChange={(e) => setPickup(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number</Label>
                <Input placeholder="+254 7XX XXX XXX" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline">Save Draft</Button>
            <Button className="bg-[#0057A8] hover:bg-[#0057A8]/90" onClick={() => setPreview(true)}>
              <FileText className="h-4 w-4 mr-1" /> Generate Referral Letter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 h-fit">
        <CardHeader><CardTitle className="text-base">Quick Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{selected?.name ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Receiving</span><span className="font-medium text-right">{facility || "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Urgency</span><Badge variant="outline" className={urgencyClass(urgency)}>{urgency}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Transport</span><span className="font-medium">{transport}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Documents</span><span className="font-medium">{docs.length}</span></div>
        </CardContent>
      </Card>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Referral Letter Preview</DialogTitle></DialogHeader>
          <div className="rounded-md border bg-white p-6 text-sm leading-relaxed text-slate-800 print:border-0">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#0057A8] font-semibold">Kenyatta County Hospital 🇰🇪</p>
                <p className="text-xs text-muted-foreground">Ministry of Health · Republic of Kenya</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Ref: REF-{Math.floor(Math.random() * 9000 + 1000)}</p>
              </div>
            </div>

            <h3 className="mt-4 font-semibold text-base">To: {facility || "_____________________"}</h3>
            <p className="mt-2">Dear Colleague,</p>
            <p className="mt-2">
              I am referring <strong>{selected?.name ?? "_____________________"}</strong>
              {selected && <> (National ID: {selected.nationalId}, {selected.gender}, {selected.age}y)</>}{" "}
              for further management. The urgency of this referral is <strong>{urgency}</strong>.
            </p>

            <p className="mt-3 font-semibold">Reason for Referral</p>
            <p>{reason || "—"}</p>

            <p className="mt-3 font-semibold">Clinical Summary</p>
            <p className="whitespace-pre-wrap">{summary || "—"}</p>

            <p className="mt-3 font-semibold">Accompanying Documents</p>
            <ul className="list-disc pl-5">{docs.map((d) => <li key={d}>{d}</li>)}</ul>

            <p className="mt-3 font-semibold">Transport</p>
            <p>{transport}{transport === "Ambulance" && pickup && ` — pickup ${new Date(pickup).toLocaleString()}, contact ${contact}`}</p>

            <p className="mt-6">Yours sincerely,</p>
            <p className="mt-6 font-semibold">Dr. Mwangi</p>
            <p className="text-xs text-muted-foreground">Medical Officer · Kenyatta County Hospital</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreview(false)}>Close</Button>
            <Button variant="outline"><Share2 className="h-4 w-4 mr-1" /> Send Electronically</Button>
            <Button className="bg-[#0057A8] hover:bg-[#0057A8]/90" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const STATUS_FILTERS: ("All" | ReferralStatus)[] = ["All", "Pending", "Received", "Completed", "No Feedback"];

function ReferralTracker() {
  const [filter, setFilter] = useState<"All" | ReferralStatus>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = sampleReferrals.filter((r) => filter === "All" || r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            className={cn(filter === s && "bg-[#0057A8] hover:bg-[#0057A8]/90")}
            onClick={() => setFilter(s)}
          >
            {s}
            <span className="ml-1.5 text-xs opacity-70">
              ({s === "All" ? sampleReferrals.length : sampleReferrals.filter(r => r.status === s).length})
            </span>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Referral ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Sent To</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const open = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpanded(open ? null : r.id)}>
                      <TableCell><ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} /></TableCell>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.patient}</TableCell>
                      <TableCell className="text-sm">{r.sentTo}</TableCell>
                      <TableCell>{r.dateSent}</TableCell>
                      <TableCell><Badge variant="outline" className={urgencyClass(r.urgency)}>{r.urgency}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={statusClass(r.status)}>{r.status}</Badge></TableCell>
                    </TableRow>
                    {open && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell />
                        <TableCell colSpan={6} className="py-4">
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">Reason</p>
                              <p>{r.reason}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">Outcome from receiving facility</p>
                              <p className={cn(!r.outcome && "italic text-muted-foreground")}>
                                {r.outcome ?? "No feedback received yet."}
                              </p>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="outline"><Send className="h-3.5 w-3.5 mr-1" /> Follow up</Button>
                              <Button size="sm" variant="outline"><FileText className="h-3.5 w-3.5 mr-1" /> View letter</Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralsPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Share2 className="h-6 w-6 text-[#0057A8]" />
        <h1 className="text-2xl font-semibold">Referrals</h1>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList>
          <TabsTrigger value="send">Send Referral</TabsTrigger>
          <TabsTrigger value="tracker">Referral Tracker</TabsTrigger>
        </TabsList>
        <TabsContent value="send"><SendReferralForm /></TabsContent>
        <TabsContent value="tracker"><ReferralTracker /></TabsContent>
      </Tabs>
    </div>
  );
}
