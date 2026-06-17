import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserPlus, Eye, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegisterPatientSheet } from "@/components/patients/RegisterPatientSheet";
import { supabase } from "@/integrations/supabase/client";

type PatientRow = {
  id: string;
  full_name: string;
  national_id: string;
  dob: string;
  gender: "Male" | "Female";
  phone: string | null;
  county: string | null;
  sub_county: string | null;
  blood_group: string | null;
  nok_name: string | null;
  nok_phone: string | null;
  created_at: string;
  updated_at: string;
};

type PatientWithMeta = PatientRow & {
  age: number;
  lastVisit: string;
  name: string;
};

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [{ title: "Patients · AfyaLink HMS" }],
  }),
  component: PatientsPage,
});

const PAGE_SIZE = 5;

function calculateAge(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / 31557600000);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((segment) => segment[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizePatient(row: PatientRow): PatientWithMeta {
  return {
    ...row,
    name: row.full_name,
    age: calculateAge(row.dob),
    lastVisit: row.updated_at.slice(0, 10),
  };
}

function PatientsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [patients, setPatients] = useState<PatientWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      const { data, error } = await supabase
        .from("patients")
        .select(
          "id, full_name, national_id, dob, gender, phone, county, sub_county, blood_group, nok_name, nok_phone, created_at, updated_at",
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load patients:", error.message);
        setPatients([]);
      } else {
        setPatients((data ?? []).map(normalizePatient));
      }
      setLoading(false);
    }
    loadPatients();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.national_id.toLowerCase().includes(q),
    );
  }, [query, patients]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading patients…" : `${patients.length} registered patients`}
          </p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Register New Patient
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or National ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          maxLength={60}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {initials(p.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.national_id}
                  </TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {p.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{p.lastVisit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/patients/$patientId" params={{ patientId: p.id }}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {slice.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    {loading ? "Loading records…" : "No patients found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            Page {current} of {totalPages} · {filtered.length} results
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={current === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={current === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <RegisterPatientSheet open={registerOpen} onOpenChange={setRegisterOpen} />
    </div>
  );
}
