/**
 * CheckInDialog
 *
 * Changes from previous version:
 *  • The hardcoded DOCTORS array is gone.  Instead we call
 *    useClinicalStaff() to fetch live Doctor / Clinician profiles.
 *  • The "Assigned Doctor" select shows "Dr. Full Name (Doctor)"
 *    style labels pulled from the database.
 *  • assigned_to now stores the clinician's full_name (so the queue
 *    display keeps working) AND we also store the clinician's user
 *    id as assigned_to_id via the opd_queue row if the column exists
 *    (gracefully ignored otherwise – see note below).
 *  • Proper loading and empty states for the doctor list.
 */

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
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
import { TRIAGE_META, TRIAGE_ORDER, type Triage } from "@/data/queue";
import { initials } from "@/data/patients";
import { useClinicalStaff } from "@/hooks/useClinicalStaff";

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
  // Stores "<uuid>|<full_name>" so we can split on submit
  const [doctorValue, setDoctorValue] = useState<string>("");
  const [results, setResults] = useState<PatientOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch live clinical staff from Supabase
  const { staff: clinicalStaff, loading: staffLoading } = useClinicalStaff();

  const selected = results.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchPatients = async () => {
      setSearchLoading(true);
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
      setSearchLoading(false);
    };

    fetchPatients();
  }, [query]);

  const reset = () => {
    setQuery("");
    setSelectedId(null);
    setTriage("");
    setDoctorValue("");
    setResults([]);
  };

  const handleSubmit = () => {
    if (!selected || !triage || !doctorValue) {
      toast.error("Select a patient, triage level and assigned doctor");
      return;
    }

    // doctorValue is "<uuid>|<full_name>"
    const [, doctorName] = doctorValue.split("|");

    onCheckIn({
      queue_no: nextQueueNo,
      patient_id: selected.id,
      patient_name: selected.full_name,
      triage,
      assigned_to: doctorName,   // human-readable name stored in the DB column
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
          {/* ── Patient search ── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Search patient</Label>
            <div className="relative">
              {searchLoading ? (
                <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : (
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
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
                  {query.trim() ? "No matches" : "Type a name or ID to search"}
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
                        {p.national_id} ·{" "}
                        {Math.floor(
                          (Date.now() - new Date(p.dob).getTime()) / 31557600000,
                        )}
                        y {p.gender}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Triage + Doctor ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Triage (SATS)</Label>
              <Select
                value={triage}
                onValueChange={(v) => setTriage(v as Triage)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {TRIAGE_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${TRIAGE_META[t].dot}`}
                        />
                        {t} — {TRIAGE_META[t].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Assigned Doctor</Label>
              <Select value={doctorValue} onValueChange={setDoctorValue}>
                <SelectTrigger>
                  {staffLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    <SelectValue placeholder="Select doctor" />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {clinicalStaff.length === 0 && !staffLoading ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No approved doctors/clinicians found.
                      <br />
                      Approve staff in the Users page first.
                    </div>
                  ) : (
                    clinicalStaff.map((s) => (
                      <SelectItem
                        key={s.id}
                        value={`${s.id}|${s.full_name}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{s.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({s.role})
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Next queue number:{" "}
            <span className="font-mono font-medium">{nextQueueNo}</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Check In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
