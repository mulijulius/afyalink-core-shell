import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { KENYA_COUNTIES, BLOOD_GROUPS } from "@/data/patients";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const empty = {
  fullName: "",
  nationalId: "",
  dob: "",
  gender: "",
  phone: "",
  county: "",
  subCounty: "",
  nokName: "",
  nokPhone: "",
  bloodGroup: "",
  allergies: "",
  nhif: "",
};

export function RegisterPatientSheet({ open, onOpenChange }: Props) {
  const [form, setForm] = useState(empty);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const reset = () => {
    setForm(empty);
    setSavedId(null);
    setShowQr(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.nationalId.trim()) {
      toast.error("Full Name and National ID are required");
      return;
    }
    const id = `AFL-${Date.now().toString().slice(-6)}`;
    setSavedId(id);
    toast.success(`Patient registered · ${id}`);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Register New Patient</SheetTitle>
          <SheetDescription>
            Capture demographics and clinical baseline.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="space-y-4 px-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <Input
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                maxLength={100}
                required
              />
            </Field>
            <Field label="National ID Number" required>
              <Input
                value={form.nationalId}
                onChange={(e) => set("nationalId", e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="Date of Birth">
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Phone Number">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+254 7xx xxx xxx"
                maxLength={20}
              />
            </Field>
            <Field label="NHIF Number (optional)">
              <Input
                value={form.nhif}
                onChange={(e) => set("nhif", e.target.value)}
                maxLength={30}
              />
            </Field>
            <Field label="County">
              <Select value={form.county} onValueChange={(v) => set("county", v)}>
                <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {KENYA_COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sub-County">
              <Input
                value={form.subCounty}
                onChange={(e) => set("subCounty", e.target.value)}
                maxLength={60}
              />
            </Field>
            <Field label="Next of Kin Name">
              <Input
                value={form.nokName}
                onChange={(e) => set("nokName", e.target.value)}
                maxLength={100}
              />
            </Field>
            <Field label="Next of Kin Phone">
              <Input
                value={form.nokPhone}
                onChange={(e) => set("nokPhone", e.target.value)}
                maxLength={20}
              />
            </Field>
            <Field label="Blood Group">
              <Select value={form.bloodGroup} onValueChange={(v) => set("bloodGroup", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Known Allergies">
            <Textarea
              value={form.allergies}
              onChange={(e) => set("allergies", e.target.value)}
              placeholder="Comma-separated, e.g. Penicillin, Sulfa"
              maxLength={500}
              rows={3}
            />
          </Field>

          {savedId && (
            <div className="rounded-md border bg-muted/40 p-4">
              <p className="text-sm font-medium">Patient saved</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                File number <span className="font-mono">{savedId}</span>
              </p>
              {showQr ? (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-md bg-background p-4">
                  <QRCodeSVG
                    value={`afyalink://patient/${savedId}`}
                    size={140}
                    fgColor="#0057A8"
                  />
                  <p className="font-mono text-xs text-muted-foreground">{savedId}</p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowQr(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                </Button>
              )}
            </div>
          )}

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{savedId ? "Save Changes" : "Save Patient"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
