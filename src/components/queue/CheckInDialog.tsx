import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DOCTORS, TRIAGE_META, TRIAGE_ORDER, type Triage } from "@/data/queue";
import { initials } from "@/data/patients";

type PatientOption = {
  id: string;
  full_name: string;
  national_id: string;
  gender: Database["public"]["Enums"]["gender"];
  dob: string;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCheckIn: (entry: Database["public"]["Tables"]["opd_queue"]["Insert"]) => void;
  nextQueueNo: string;
};

export function CheckInDialog({ open, onOpenChange, onCheckIn, nextQueueNo }: Props) {
    const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [triage, setTriage] = useState<Triage | "">("");
  const [doctor, setDoctor] = useState<string>("");
  const [results, setResults] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);

  const selected = results.find((p) => p.id === selectedId) ?? null;
  const selectedAge = selected ? Math.floor((Date.now() - new Date(selected.dob).getTime()) / 31557600000) : null;

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchPatients = async () => {
      setLoading(true);
      const q = query.trim().toLowerCase();
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, national_id, gender, dob")
        .or(`full_name.ilike.%${q}%,national_id.ilike.%${q}%`)
        .limit(5);
      if (error) {
        console.error("Failed to search patients:", error.message);
        setResults([]);
      } else {
        setResults(data ?? []);
      }
      setLoading(false);
    };

    fetchPatients();
  }, [query]);

  const reset = () => {
    setQuery("");
    setSelectedId(null);
    setTriage("");
    setDoctor("");
  };

  const handleSubmit = () => {
    if (!selected || !triage || !doctor) {
      toast.error("Select patient, triage and doctor");
      return;
    }
    onCheckIn({
      queue_no: nextQueueNo,
      patient_id: selected.id,
      patient_name: selected.full_name,
      triage,
      assigned_to: doctor,
      status: "Waiting",
    });
    toast.success(`${selected.full_name} checked in as ${nextQueueNo}`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Check In Patient</DialogTitle>
          <DialogDescription>
            Search for a registered patient and assign triage priority.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Search patient</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Name or National ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={60}
                className="pl-9"
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-md border">
              {results.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  No matches
                </p>
              ) : (
                results.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60 ${
                      selectedId === p.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials(p.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.full_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {p.national_id} · {Math.floor((Date.now() - new Date(p.dob).getTime()) / 31557600000)}y {p.gender}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Triage (SATS)</Label>
              <Select value={triage} onValueChange={(v) => setTriage(v as Triage)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TRIAGE_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${TRIAGE_META[t].dot}`} />
                        {t} — {TRIAGE_META[t].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Assigned Doctor</Label>
              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DOCTORS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Next queue number: <span className="font-mono font-medium">{nextQueueNo}</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Check In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
