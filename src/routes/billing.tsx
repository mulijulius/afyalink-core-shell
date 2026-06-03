import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Trash2,
  Receipt,
  Loader2,
  Check,
  FileText,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { patients } from "@/data/patients";
import {
  claims as initialClaims,
  transactions,
  defaultBillItems,
  ksh,
  type BillItem,
  type Claim,
  type PaymentMethod,
} from "@/data/billing";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Billing · AfyaLink HMS" }] }),
  component: BillingPage,
});

function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoices, payments and NHIF claims.
        </p>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new"><Receipt className="mr-1.5 h-4 w-4" />New Bill</TabsTrigger>
          <TabsTrigger value="history"><FileText className="mr-1.5 h-4 w-4" />Payment History</TabsTrigger>
          <TabsTrigger value="claims"><Send className="mr-1.5 h-4 w-4" />NHIF Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4"><NewBillTab /></TabsContent>
        <TabsContent value="history" className="mt-4"><HistoryTab /></TabsContent>
        <TabsContent value="claims" className="mt-4"><ClaimsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------- New Bill -------------------- */

function NewBillTab() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<BillItem[]>(defaultBillItems);
  const [method, setMethod] = useState<PaymentMethod>("M-Pesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [nhifNo, setNhifNo] = useState("");
  const [stkState, setStkState] = useState<"idle" | "sending" | "confirmed">("idle");

  const patient = patients.find((p) => p.id === selectedId);
  const visitId = patient ? `V-${patient.nationalId.slice(-4)}` : "—";
  const today = new Date().toISOString().slice(0, 10);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 5);
    return patients
      .filter((p) => p.name.toLowerCase().includes(q) || p.nationalId.includes(q))
      .slice(0, 5);
  }, [query]);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const nhifDeduction = method === "NHIF" ? Math.round(subtotal * 0.6) : 0;
  const amountDue = subtotal - nhifDeduction;

  const updateItem = (id: string, patch: Partial<BillItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      { id: `i-${Date.now()}`, service: "", qty: 1, unitCost: 0 },
    ]);

  const removeRow = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const sendStk = () => {
    if (!/^\+?\d{9,13}$/.test(mpesaPhone.replace(/\s/g, ""))) {
      toast.error("Enter a valid phone number");
      return;
    }
    setStkState("sending");
    setTimeout(() => {
      setStkState("confirmed");
      toast.success(`M-Pesa payment of ${ksh(amountDue)} confirmed`);
    }, 1800);
  };

  const submitClaim = () => {
    if (!nhifNo.trim()) {
      toast.error("Enter NHIF number");
      return;
    }
    toast.success(`NHIF claim submitted for ${ksh(amountDue)}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Search patient</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name or National ID"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
                  maxLength={60}
                  className="pl-9"
                />
              </div>
              {!patient && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-md border">
                  {matches.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{p.nationalId}</span>
                    </button>
                  ))}
                  {matches.length === 0 && (
                    <p className="p-3 text-center text-xs text-muted-foreground">No matches</p>
                  )}
                </div>
              )}
            </div>

            {patient && (
              <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-3">
                <Meta label="Patient" value={patient.name} />
                <Meta label="Visit ID" value={visitId} mono />
                <Meta label="Date" value={today} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">Itemized Bill</h3>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" /> Add Row
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service / Item</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-32">Unit Cost (KES)</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Input
                        value={i.service}
                        onChange={(e) => updateItem(i.id, { service: e.target.value })}
                        maxLength={80}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateItem(i.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={i.unitCost}
                        onChange={(e) => updateItem(i.id, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(i.qty * i.unitCost).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeRow(i.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-5">
            <h3 className="font-semibold">Summary</h3>
            <SummaryRow label="Subtotal" value={ksh(subtotal)} />
            <SummaryRow label="NHIF Deduction" value={`− ${ksh(nhifDeduction)}`} muted />
            <div className="border-t pt-3">
              <SummaryRow label="Amount Due" value={ksh(amountDue)} emphasis />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <Label className="text-xs font-medium">Payment Method</Label>
            <Select value={method} onValueChange={(v) => { setMethod(v as PaymentMethod); setStkState("idle"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                <SelectItem value="NHIF">NHIF</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>

            {method === "M-Pesa" && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-medium">Phone Number</Label>
                <Input
                  placeholder="+254 7xx xxx xxx"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  maxLength={20}
                  disabled={stkState !== "idle"}
                />
                {stkState === "confirmed" ? (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700">
                    <Check className="h-4 w-4" /> Payment Confirmed
                  </div>
                ) : (
                  <Button className="w-full" onClick={sendStk} disabled={stkState === "sending"}>
                    {stkState === "sending" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Awaiting confirmation…</>
                    ) : (
                      "Send STK Push"
                    )}
                  </Button>
                )}
              </div>
            )}

            {method === "NHIF" && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-medium">NHIF Number</Label>
                <Input
                  placeholder="NHIF-XXXXXX"
                  value={nhifNo}
                  onChange={(e) => setNhifNo(e.target.value)}
                  maxLength={30}
                />
                <Button className="w-full" onClick={submitClaim}>Submit Claim</Button>
              </div>
            )}

            {method === "Cash" && (
              <Button className="w-full" onClick={() => toast.success(`Cash payment of ${ksh(amountDue)} recorded`)}>
                Record Cash Payment
              </Button>
            )}

            {method === "Insurance" && (
              <Button className="w-full" onClick={() => toast.success("Insurance claim queued")}>
                Submit to Insurer
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function SummaryRow({
  label, value, muted, emphasis,
}: { label: string; value: string; muted?: boolean; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`font-mono ${emphasis ? "text-lg font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

/* -------------------- Payment History -------------------- */

function HistoryTab() {
  const statusClass = (s: string) =>
    s === "Paid"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : s === "Pending"
        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-700"
        : "border-red-500/30 bg-red-500/10 text-red-700";

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No.</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount (KES)</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.receipt}>
                <TableCell className="font-mono">{t.receipt}</TableCell>
                <TableCell className="font-medium">{t.patient}</TableCell>
                <TableCell className="text-muted-foreground">{t.date}</TableCell>
                <TableCell className="text-right font-mono">{t.amount.toLocaleString()}</TableCell>
                <TableCell>{t.method}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusClass(t.status)}>{t.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/* -------------------- NHIF Claims -------------------- */

function ClaimsTab() {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);

  const claimStatusClass = (s: string) =>
    s === "Approved"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : s === "Submitted"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-red-500/30 bg-red-500/10 text-red-700";

  const newClaim = () => {
    const id = `CLM-${3019 + claims.length - initialClaims.length}`;
    setClaims((prev) => [
      {
        claimId: id,
        patient: "New Patient",
        visitDate: new Date().toISOString().slice(0, 10),
        amount: 2000,
        submitted: new Date().toISOString().slice(0, 10),
        status: "Submitted",
      },
      ...prev,
    ]);
    toast.success(`Claim ${id} created`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={newClaim}>
          <Plus className="mr-2 h-4 w-4" /> Generate New Claim
        </Button>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={150}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead className="text-right">Amount (KES)</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((c) => (
                  <TableRow key={c.claimId}>
                    <TableCell className="font-mono">{c.claimId}</TableCell>
                    <TableCell className="font-medium">{c.patient}</TableCell>
                    <TableCell className="text-muted-foreground">{c.visitDate}</TableCell>
                    <TableCell className="text-right font-mono">{c.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{c.submitted}</TableCell>
                    <TableCell>
                      {c.status === "Rejected" && c.rejectionReason ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`${claimStatusClass(c.status)} cursor-help`}
                            >
                              {c.status}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs font-medium">Reason</p>
                            <p className="text-xs">{c.rejectionReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="outline" className={claimStatusClass(c.status)}>
                          {c.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </Card>
    </div>
  );
}
