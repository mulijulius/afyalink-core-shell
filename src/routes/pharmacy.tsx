import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Check,
  AlertTriangle,
  CalendarClock,
  Pill,
  ClipboardList,
  Truck,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  initialDrugs,
  prescriptionVisits,
  statusFor,
  daysUntil,
  DRUG_CATEGORIES,
  type Drug,
  type PrescriptionVisit,
} from "@/data/pharmacy";

export const Route = createFileRoute("/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy · AfyaLink HMS" }] }),
  component: PharmacyPage,
});

function statusBadge(s: ReturnType<typeof statusFor>) {
  if (s === "In Stock") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  if (s === "Low Stock") return "border-yellow-500/40 bg-yellow-500/15 text-yellow-700";
  return "border-red-500/30 bg-red-500/10 text-red-700";
}

function PharmacyPage() {
  const [drugs, setDrugs] = useState<Drug[]>(initialDrugs);
  const [addOpen, setAddOpen] = useState(false);

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
                    <TableCell className="font-mono text-muted-foreground">{d.reorderLevel}</TableCell>
                    <TableCell className="text-muted-foreground">{d.expiry}</TableCell>
                    <TableCell className="text-muted-foreground">{d.supplier}</TableCell>
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
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PrescriptionVisit | null>(null);
  const [dispensed, setDispensed] = useState<Record<string, boolean>>({});

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prescriptionVisits;
    return prescriptionVisits.filter(
      (v) =>
        v.patient.toLowerCase().includes(q) ||
        v.nationalId.includes(q) ||
        v.visitId.toLowerCase().includes(q),
    );
  }, [query]);

  const handleDispense = (rxId: string, drug: string) => {
    setDispensed((prev) => ({ ...prev, [rxId]: true }));
    toast.success(`${drug} dispensed`);
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patient name, National ID, or visit ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          maxLength={60}
          className="pl-9"
        />
      </div>

      {!selected ? (
        <Card className="p-0">
          <div className="divide-y">
            {matches.map((v) => (
              <button
                key={v.visitId}
                onClick={() => setSelected(v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/60"
              >
                <div>
                  <p className="font-medium">{v.patient}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{v.nationalId}</span> · Visit{" "}
                    <span className="font-mono">{v.visitId}</span> · {v.date} · {v.clinician}
                  </p>
                </div>
                <Badge variant="outline">{v.prescriptions.length} Rx</Badge>
              </button>
            ))}
            {matches.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No matching visits
              </p>
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
                  Visit <span className="font-mono">{selected.visitId}</span> · {selected.date} · {selected.clinician}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
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
                  {selected.prescriptions.map((rx) => {
                    const done = dispensed[rx.id];
                    return (
                      <TableRow key={rx.id}>
                        <TableCell className="font-medium">{rx.drug}</TableCell>
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
                            <Button size="sm" onClick={() => handleDispense(rx.id, rx.drug)}>
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
  const lowStock = drugs.filter((d) => d.stock < d.reorderLevel);
  const expiringSoon = drugs.filter((d) => {
    const days = daysUntil(d.expiry);
    return days >= 0 && days <= 90;
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
                    <span className="font-mono">{d.reorderLevel}</span>
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
                    Expires {d.expiry} · {daysUntil(d.expiry)} days left
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
  const [form, setForm] = useState(emptyDrug);
  const set = (k: keyof typeof emptyDrug, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.name.trim() || !form.category || !form.expiry) {
      toast.error("Name, category and expiry are required");
      return;
    }
    onAdd({
      id: `d-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      stock: Number(form.stock) || 0,
      unit: form.unit.trim() || "units",
      reorderLevel: Number(form.reorderLevel) || 0,
      expiry: form.expiry,
      supplier: form.supplier.trim() || "—",
    });
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add Drug</Button>
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
