import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search, Plus, Check, AlertTriangle, CalendarClock, Pill, ClipboardList, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/TableSkeleton";

const DRUG_CATEGORIES = [
  "Antibiotic", "Antimalarial", "Antihypertensive", "Antidiabetic",
  "Analgesic", "ORS / Fluids", "Antifungal", "Antihistamine",
  "Vitamin / Supplement", "Other",
];

const DRUG_COLUMNS = "id, name, category, stock, unit, reorder_level, expiry_date, supplier";

type Drug = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorder_level: number;
  expiry_date: string | null;
  supplier: string | null;
};

type PrescriptionRow = {
  id: string;
  visit_id: string | null;
  patient_id: string | null;
  patient_name: string;
  drug_name: string;
  dose: string;
  quantity: string;
  prescribed_by_name: string | null;
  dispensed: boolean;
  created_at: string;
};

type RxGroup = {
  key: string;
  visitId: string | null;
  patient: string;
  date: string;
  clinician: string;
  items: PrescriptionRow[];
};

function groupPrescriptions(rows: PrescriptionRow[]): RxGroup[] {
  const groups = new Map<string, RxGroup>();
  for (const row of rows) {
    const key = row.visit_id ?? `rx-${row.id}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(row);
    } else {
      groups.set(key, {
        key,
        visitId: row.visit_id,
        patient: row.patient_name,
        date: row.created_at.slice(0, 10),
        clinician: row.prescribed_by_name || "—",
        items: [row],
      });
    }
  }
  return Array.from(groups.values());
}

export const Route = createFileRoute("/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy · AfyaLink HMS" }] }),
  component: PharmacyPage,
});

function statusFor(d: Drug): "In Stock" | "Low Stock" | "Out of Stock" {
  if (d.stock === 0) return "Out of Stock";
  if (d.stock < d.reorder_level) return "Low Stock";
  return "In Stock";
}

function daysUntil(iso: string | null) {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
}

function statusBadge(s: ReturnType<typeof statusFor>) {
  if (s === "In Stock") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  if (s === "Low Stock") return "border-yellow-500/40 bg-yellow-500/15 text-yellow-700";
  return "border-red-500/30 bg-red-500/10 text-red-700";
}

function PharmacyPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const fetchDrugs = async () => {
      const { data, error } = await supabase
        .from("pharmacy_drugs")
        .select(DRUG_COLUMNS)
        .order("name");
      if (error) {
        console.error("Failed to load drugs:", error.message);
        setDrugs([]);
      } else {
        setDrugs(data ?? []);
      }
      setLoading(false);
    };
    fetchDrugs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pharmacy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inventory, dispensing and stock alerts.
        </p>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory"><Pill className="mr-1.5 h-4 w-4" />Inventory</TabsTrigger>
          <TabsTrigger value="dispense"><ClipboardList className="mr-1.5 h-4 w-4" />Dispense</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="mr-1.5 h-4 w-4" />Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <InventoryTab
            drugs={drugs}
            onOpenAdd={() => setAddOpen(true)}
          />
        </TabsContent>

        <TabsContent value="dispense" className="mt-4">
          <DispenseTab />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <AlertsTab drugs={drugs} />
        </TabsContent>
      </Tabs>

      <AddDrugDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(d) => setDrugs((prev) => [d, ...prev])}
      />
    </div>
  );
}

/* -------------------- Inventory -------------------- */

function InventoryTab({ drugs, onOpenAdd }: { drugs: Drug[]; onOpenAdd: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = drugs.filter((d) =>
    d.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search drugs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={60}
            className="pl-9"
          />
        </div>
        <Button onClick={onOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Drug
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Reorder Lvl</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const s = statusFor(d);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.category}</TableCell>
                    <TableCell className="font-mono">{d.stock}</TableCell>
                    <TableCell className="text-muted-foreground">{d.unit}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{d.reorder_level}</TableCell>
                    <TableCell className="text-muted-foreground">{d.expiry_date ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{d.supplier ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge(s)}>
                        {s}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    No drugs match your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------- Dispense -------------------- */

function DispenseTab() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("id, visit_id, patient_id, patient_name, drug_name, dose, quantity, prescribed_by_name, dispensed, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load prescriptions:", error.message);
        setRows([]);
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    };
    fetchPrescriptions();
  }, []);

  const groups = useMemo(() => groupPrescriptions(rows), [rows]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.patient.toLowerCase().includes(q) ||
        (g.visitId ?? "").toLowerCase().includes(q) ||
        g.items.some((rx) => rx.drug_name.toLowerCase().includes(q)),
    );
  }, [query, groups]);

  const selected = groups.find((g) => g.key === selectedKey) ?? null;

  const handleDispense = async (rxId: string, drug: string) => {
    const { error } = await supabase
      .from("prescriptions")
      .update({
        dispensed: true,
        dispensed_by: user?.id ?? null,
        dispensed_at: new Date().toISOString(),
      })
      .eq("id", rxId);

    if (error) {
      console.error("Failed to record dispense:", error.message);
      toast.error("Unable to record dispense");
      return;
    }

    setRows((prev) => prev.map((rx) => (rx.id === rxId ? { ...rx, dispensed: true } : rx)));
    toast.success(`${drug} dispensed`);
  };

  if (loading) {
    return <TableSkeleton cols={4} rows={4} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patient name, drug, or visit"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedKey(null);
          }}
          maxLength={60}
          className="pl-9"
        />
      </div>

      {!selected ? (
        <Card className="p-0">
          <div className="divide-y">
            {matches.map((g) => (
              <button
                key={g.key}
                onClick={() => setSelectedKey(g.key)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/60"
              >
                <div>
                  <p className="font-medium">{g.patient}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.visitId && (
                      <>
                        Visit <span className="font-mono">{g.visitId.slice(0, 8)}</span> ·{" "}
                      </>
                    )}
                    {g.date} · {g.clinician}
                  </p>
                </div>
                <Badge variant="outline">{g.items.length} Rx</Badge>
              </button>
            ))}
            {matches.length === 0 && (
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title="No matching prescriptions"
                className="border-0"
              />
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{selected.patient}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.visitId && (
                    <>
                      Visit <span className="font-mono">{selected.visitId.slice(0, 8)}</span> ·{" "}
                    </>
                  )}
                  {selected.date} · {selected.clinician}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedKey(null)}>
                Back
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.items.map((rx) => {
                    const done = rx.dispensed;
                    return (
                      <TableRow key={rx.id}>
                        <TableCell className="font-medium">{rx.drug_name}</TableCell>
                        <TableCell>{rx.dose}</TableCell>
                        <TableCell className="text-muted-foreground">{rx.quantity}</TableCell>
                        <TableCell className="text-right">
                          {done ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            >
                              <Check className="mr-1 h-3 w-3" /> Dispensed
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => handleDispense(rx.id, rx.drug_name)}>
                              Dispense
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* -------------------- Alerts -------------------- */

function AlertsTab({ drugs }: { drugs: Drug[] }) {
  const lowStock = drugs.filter((d) => d.stock < d.reorder_level);
  const expiringSoon = drugs.filter((d) => {
    const days = daysUntil(d.expiry_date);
    return days !== null && days >= 0 && days <= 90;
  });

  const handleRestock = (name: string) => toast.success(`Restock request sent for ${name}`);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold">Low Stock</h3>
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
              {lowStock.length}
            </Badge>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No low-stock items</p>
          ) : (
            lowStock.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock <span className="font-mono">{d.stock}</span> {d.unit} · Reorder at{" "}
                    <span className="font-mono">{d.reorder_level}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700">
                    Low Stock
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleRestock(d.name)}>
                    <Truck className="mr-1 h-3.5 w-3.5" /> Restock
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold">Expiring Soon</h3>
            <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-700">
              {expiringSoon.length}
            </Badge>
          </div>
          {expiringSoon.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No items expiring soon</p>
          ) : (
            expiringSoon.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {d.expiry_date} · {daysUntil(d.expiry_date)} days left
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-700">
                    Expiry Soon
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleRestock(d.name)}>
                    <Truck className="mr-1 h-3.5 w-3.5" /> Restock
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Add Drug dialog -------------------- */

const emptyDrug = {
  name: "",
  category: "",
  stock: "",
  unit: "",
  reorderLevel: "",
  expiry: "",
  supplier: "",
};

function AddDrugDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (d: Drug) => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyDrug);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof emptyDrug, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.category || !form.expiry) {
      toast.error("Name, category and expiry are required");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase
      .from("pharmacy_drugs")
      .insert({
        name: form.name.trim(),
        category: form.category,
        stock: Number(form.stock) || 0,
        unit: form.unit.trim() || "tabs",
        reorder_level: Number(form.reorderLevel) || 0,
        expiry_date: form.expiry,
        supplier: form.supplier.trim() || null,
        updated_by: user?.id ?? null,
      })
      .select(DRUG_COLUMNS)
      .single();

    setBusy(false);

    if (error) {
      console.error("Failed to add drug:", error.message);
      toast.error(error.message || "Unable to add drug");
      return;
    }

    onAdd(data);
    toast.success("Drug added to inventory");
    setForm(emptyDrug);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setForm(emptyDrug); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Drug</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Drug Name" full>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
          </Field>
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {DRUG_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Supplier">
            <Input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} maxLength={60} />
          </Field>
          <Field label="Stock">
            <Input type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          </Field>
          <Field label="Unit">
            <Input placeholder="tabs / strips / packs" value={form.unit} onChange={(e) => set("unit", e.target.value)} maxLength={20} />
          </Field>
          <Field label="Reorder Level">
            <Input type="number" min={0} value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} />
          </Field>
          <Field label="Expiry Date">
            <Input type="date" value={form.expiry} onChange={(e) => set("expiry", e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Add Drug"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
