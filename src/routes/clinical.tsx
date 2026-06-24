import { useEffect, useMemo, useState, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Stethoscope, Search, Eye, ClipboardList, FlaskConical,
  AlertTriangle, Clock, Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";

type Triage = Database["public"]["Enums"]["triage_level"];
type QueueStatus = Database["public"]["Enums"]["queue_status"];

type QueueEntry = {
  id: string;
  queue_no: string;
  patient_id: string | null;
  patient_name: string;
  check_in_time: string;
  triage: Triage;
  assigned_to: string | null;
  status: QueueStatus;
};

type PatientRow = {
  id: string;
  full_name: string;
  national_id: string;
  dob: string;
  gender: "Male" | "Female";
  phone: string | null;
  updated_at: string;
};

const TRIAGE_META: Record<Triage, { dot: string; badge: string }> = {
  Red:    { dot: "bg-red-500",     badge: "bg-red-500/10 text-red-700 border-red-500/30" },
  Orange: { dot: "bg-orange-500",  badge: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  Yellow: { dot: "bg-yellow-500",  badge: "bg-yellow-500/15 text-yellow-700 border-yellow-500/40" },
  Green:  { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  Blue:   { dot: "bg-blue-600",    badge: "bg-blue-600/10 text-blue-700 border-blue-600/30" },
};

const TRIAGE_ORDER: Triage[] = ["Red", "Orange", "Yellow", "Green", "Blue"];

function calculateAge(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  return Math.floor((Date.now() - birth.getTime()) / 31557600000);
}

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function formatWait(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export const Route = createFileRoute("/clinical")({
  head: () => ({ meta: [{ title: "Clinical Workspace · AfyaLink HMS" }] }),
  component: ClinicalWorkspacePage,
});

function ClinicalWorkspacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [criticalCount, setCriticalCount] = useState<number | null>(null);
  const [consultingId, setConsultingId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    const { data, error } = await supabase
      .from("opd_queue")
      .select("id, queue_no, patient_id, patient_name, check_in_time, triage, assigned_to, status")
      .neq("status", "Done")
      .order("check_in_time", { ascending: true });
    if (error) {
      console.error("Failed to load queue:", error.message);
      setQueue([]);
    } else {
      setQueue(data ?? []);
    }
    setQueueLoading(false);
  }, []);

  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, national_id, dob, gender, phone, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("Failed to load patients:", error.message);
      setPatients([]);
    } else {
      setPatients(data ?? []);
    }
    setPatientsLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchPatients();
    (async () => {
      const { count, error } = await supabase
        .from("lab_results")
        .select("id", { count: "exact", head: true })
        .eq("is_critical", true);
      if (!error) setCriticalCount(count ?? 0);
    })();
  }, [fetchQueue, fetchPatients]);

  const sortedQueue = useMemo(
    () =>
      [...queue].sort(
        (a, b) =>
          TRIAGE_ORDER.indexOf(a.triage) - TRIAGE_ORDER.indexOf(b.triage) ||
          new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime(),
      ),
    [queue],
  );

  /**
   * Queue filtering by assigned clinician.
   *
   * Previous implementation matched only the first name token, causing mismatches
   * when the full name in profiles didn't share a token with the stored assigned_to
   * string. Now we match on the full user.name substring (case-insensitive) OR the
   * full assigned_to string, so "Dr. James Mwangi" will match "James Mwangi".
   * If nothing matches, show the entire queue so the clinician can still work.
   */
  const myQueue = useMemo(() => {
    if (!user?.name) return sortedQueue;
    const nameLower = user.name.trim().toLowerCase();
    const mine = sortedQueue.filter((q) => {
      const assigned = (q.assigned_to ?? "").toLowerCase();
      // Match if the stored name contains any part of the user's name or vice-versa
      return assigned.includes(nameLower) || nameLower.includes(assigned);
    });
    return mine.length > 0 ? mine : sortedQueue;
  }, [sortedQueue, user]);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.full_name.toLowerCase().includes(q) || p.national_id.toLowerCase().includes(q),
    );
  }, [query, patients]);

  const waitingCount = queue.filter((q) => q.status === "Waiting").length;
  const inConsultCount = queue.filter((q) => q.status === "In Consult").length;

  /**
   * handleConsult
   *
   * 1. Updates the queue row status to "In Consult" so the display screen
   *    and dashboard counters stay accurate.
   * 2. Navigates to the clinical consultation workspace for the patient.
   *
   * If the queue row has no patient_id (walk-in not yet registered), we
   * show an error instead of navigating to a broken URL.
   */
  const handleConsult = useCallback(
    async (q: QueueEntry) => {
      if (!q.patient_id) {
        toast.error(
          `${q.patient_name} has no patient record. Register them first under Patients.`,
        );
        return;
      }

      setConsultingId(q.id);

      // Update queue status to "In Consult" if it isn't already
      if (q.status !== "In Consult") {
        const { error } = await supabase
          .from("opd_queue")
          .update({ status: "In Consult", updated_at: new Date().toISOString() })
          .eq("id", q.id);

        if (error) {
          console.error("Failed to update queue status:", error.message);
          // Non-fatal: still navigate so the clinician isn't blocked
          toast.warning("Could not update queue status, but opening consultation.");
        } else {
          // Optimistically update local state
          setQueue((prev) =>
            prev.map((entry) =>
              entry.id === q.id ? { ...entry, status: "In Consult" as QueueStatus } : entry,
            ),
          );
        }
      }

      setConsultingId(null);
      navigate({ to: "/clinical/$patientId", params: { patientId: q.patient_id } });
    },
    [navigate],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-6 w-6 text-[#0057A8]" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinical Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultations, diagnosis, prescriptions and patient records.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting in OPD</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{waitingCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Consultation</CardTitle>
            <Stethoscope className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{inConsultCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Lab Results</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{criticalCount ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registered Patients</CardTitle>
            <UsersIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{patients.length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue"><ClipboardList className="mr-1.5 h-4 w-4" />OPD Queue</TabsTrigger>
          <TabsTrigger value="patients"><UsersIcon className="mr-1.5 h-4 w-4" />Patients</TabsTrigger>
        </TabsList>

        {/* ── OPD Queue tab ── */}
        <TabsContent value="queue" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Patients waiting for or currently in consultation. Click <strong>Consult</strong> to
            open the full clinical workspace for that patient.
          </p>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              {queueLoading ? (
                <div className="p-4"><TableSkeleton cols={6} /></div>
              ) : myQueue.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="Queue is empty"
                  description="Patients checked into OPD will appear here for consultation."
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue No.</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Triage</TableHead>
                      <TableHead>Wait</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myQueue.map((q) => {
                      const meta = TRIAGE_META[q.triage];
                      const isConsulting = consultingId === q.id;
                      return (
                        <TableRow key={q.id}>
                          <TableCell className="font-mono font-medium">{q.queue_no}</TableCell>
                          <TableCell className="font-medium">{q.patient_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={meta.badge}>
                              <span className={`mr-1.5 h-2 w-2 rounded-full ${meta.dot}`} />
                              {q.triage}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {formatWait(q.check_in_time)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{q.assigned_to ?? "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                q.status === "In Consult"
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : q.status === "Triaged"
                                    ? "border-accent/30 bg-accent/10 text-accent"
                                    : ""
                              }
                            >
                              {q.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {q.patient_id ? (
                              <Button
                                size="sm"
                                disabled={isConsulting}
                                onClick={() => handleConsult(q)}
                              >
                                <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                                {isConsulting ? "Opening…" : "Consult"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-muted-foreground"
                                onClick={() =>
                                  toast.error(
                                    `${q.patient_name} has no patient record. Register them first.`,
                                  )
                                }
                              >
                                No record
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ── Patients tab ── */}
        <TabsContent value="patients" className="mt-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or National ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={60}
              className="pl-9"
            />
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              {patientsLoading ? (
                <div className="p-4"><TableSkeleton cols={6} /></div>
              ) : filteredPatients.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon className="h-6 w-6" />}
                  title="No patients found"
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                              {initials(p.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{p.full_name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.national_id}</TableCell>
                        <TableCell>{calculateAge(p.dob)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{p.gender}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.phone ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button asChild size="sm" variant="outline">
                              <Link to="/clinical/$patientId" params={{ patientId: p.id }}>
                                <Stethoscope className="mr-1.5 h-3.5 w-3.5" /> Consult
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="ghost">
                              <Link to="/patients/$patientId" params={{ patientId: p.id }}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View record</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
