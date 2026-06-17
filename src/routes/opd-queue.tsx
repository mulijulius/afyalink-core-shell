import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall, ArrowRightLeft, UserPlus, Tv, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckInDialog } from "@/components/queue/CheckInDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Triage = Database["public"]["Enums"]["triage_level"];
type QueueStatus = Database["public"]["Enums"]["queue_status"];

type QueueEntry = {
  id: string;
  queue_no: string;
  patient_name: string;
  check_in_time: string;
  triage: Triage;
  assigned_to: string | null;
  status: QueueStatus;
};

const TRIAGE_META: Record<Triage, { label: string; dot: string; badge: string }> = {
  Red: {
    label: "Immediate",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-700 border-red-500/30",
  },
  Orange: {
    label: "Very Urgent",
    dot: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  },
  Yellow: {
    label: "Urgent",
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-700 border-yellow-500/40",
  },
  Green: {
    label: "Routine",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  Blue: {
    label: "Deceased",
    dot: "bg-blue-600",
    badge: "bg-blue-600/10 text-blue-700 border-blue-600/30",
  },
};

const TRIAGE_ORDER: Triage[] = ["Red", "Orange", "Yellow", "Green", "Blue"];

export const Route = createFileRoute("/opd-queue")({
  head: () => ({ meta: [{ title: "OPD Queue · AfyaLink HMS" }] }),
  component: OpdQueuePage,
});

function useTick(ms: number) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function formatWait(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

function firstName(full: string) {
  return full.split(" ")[0];
}

function OpdQueuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);
  useTick(30_000); // refresh wait times every 30s

  useEffect(() => {
    const fetchQueue = async () => {
      const { data, error } = await supabase
        .from("opd_queue")
        .select("id, queue_no, patient_name, check_in_time, triage, assigned_to, status")
        .order("check_in_time");
      if (error) {
        console.error("Failed to load queue:", error.message);
        setQueue([]);
      } else {
        setQueue(data ?? []);
      }
      setLoading(false);
    };
    fetchQueue();
  }, []);

  const nextQueueNo = useMemo(() => {
    const max = queue
      .map((q) => parseInt(q.queueNo.replace(/\D/g, ""), 10))
      .reduce((a, b) => Math.max(a, b), 0);
    return `A${String(max + 1).padStart(3, "0")}`;
  }, [queue]);

  const counts = useMemo(() => {
    const c: Record<Triage, number> = { Red: 0, Orange: 0, Yellow: 0, Green: 0, Blue: 0 };
    for (const q of queue) c[q.triage]++;
    return c;
  }, [queue]);

  const handleCheckIn = (entry: QueueEntry) =>
    setQueue((prev) => [...prev, entry]);

  const handleCall = (q: QueueEntry) =>
    toast.success(`Calling ${q.queueNo} · ${q.patientName}`);

  const handleTransfer = (q: QueueEntry) =>
    toast.info(`Transfer ${q.queueNo} (not yet wired)`);

  // For the display screen: "now serving" is first In Consult, fallback to first Waiting
  const sorted = [...queue].sort(
    (a, b) =>
      TRIAGE_ORDER.indexOf(a.triage) - TRIAGE_ORDER.indexOf(b.triage) ||
      new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime(),
  );
  const nowServing = sorted.find((q) => q.status === "In Consult") ?? sorted[0];
  const upNext = sorted.filter((q) => q !== nowServing).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">OPD Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live outpatient triage and waiting list.
        </p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">
            <LayoutList className="mr-1.5 h-4 w-4" /> Queue Dashboard
          </TabsTrigger>
          <TabsTrigger value="display">
            <Tv className="mr-1.5 h-4 w-4" /> Display Screen
          </TabsTrigger>
        </TabsList>

        {/* ============ Dashboard view ============ */}
        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {TRIAGE_ORDER.map((t) => (
                <div
                  key={t}
                  className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${TRIAGE_META[t].badge}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${TRIAGE_META[t].dot}`} />
                  <span className="font-medium">{t}</span>
                  <span className="font-mono">{counts[t]}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => setCheckInOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Check In Patient
            </Button>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue No.</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Triage</TableHead>
                    <TableHead>Wait</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((q) => {
                    const meta = TRIAGE_META[q.triage];
                    return (
                      <TableRow key={q.queueNo}>
                        <TableCell className="font-mono font-medium">{q.queueNo}</TableCell>
                        <TableCell className="font-medium">{q.patientName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(q.checkInTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.badge}>
                            <span className={`mr-1.5 h-2 w-2 rounded-full ${meta.dot}`} />
                            {q.triage}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {formatWait(q.checkInTime)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{q.doctor}</TableCell>
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
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleCall(q)}>
                              <PhoneCall className="mr-1 h-3.5 w-3.5" /> Call
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleTransfer(q)}>
                              <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Transfer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ============ Display screen view ============ */}
        <TabsContent value="display" className="mt-4">
          <DisplayScreen nowServing={nowServing} upNext={upNext} />
        </TabsContent>
      </Tabs>

      <CheckInDialog
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onCheckIn={handleCheckIn}
        nextQueueNo={nextQueueNo}
      />
    </div>
  );
}

function DisplayScreen({
  nowServing,
  upNext,
}: {
  nowServing: QueueEntry | undefined;
  upNext: QueueEntry[];
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-between rounded-xl bg-slate-950 p-8 text-white sm:p-12">
      <div className="flex w-full items-center justify-between text-slate-300">
        <p className="text-lg font-medium sm:text-xl">Kapsabet Referral Hospital</p>
        <p className="font-mono text-2xl sm:text-4xl">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-base font-semibold uppercase tracking-[0.4em] text-emerald-400 sm:text-xl">
          Now Serving
        </p>
        {nowServing ? (
          <>
            <p className="mt-4 font-mono text-7xl font-bold tracking-tight sm:text-9xl">
              {nowServing.queueNo}
            </p>
            <p className="mt-4 text-3xl font-medium text-slate-100 sm:text-5xl">
              {firstName(nowServing.patientName)}
            </p>
            <p className="mt-2 text-base text-slate-400 sm:text-lg">
              {nowServing.doctor}
            </p>
          </>
        ) : (
          <p className="mt-6 text-3xl text-slate-400">Queue empty</p>
        )}
      </div>

      <div className="w-full">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Up Next
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {upNext.map((q) => (
            <div
              key={q.queueNo}
              className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 font-mono text-2xl font-semibold text-slate-100 sm:text-3xl"
            >
              {q.queueNo}
            </div>
          ))}
          {upNext.length === 0 && (
            <p className="text-slate-500">No one waiting</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
        <span>AfyaLink HMS</span>
        <span>🇰🇪</span>
      </div>
    </div>
  );
}
