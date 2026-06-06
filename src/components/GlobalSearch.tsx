import { useMemo, useState } from "react";
import { Search, User, Stethoscope, Pill, FileBarChart2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { patients } from "@/data/patients";
import { initialDrugs } from "@/data/pharmacy";

type Result = {
  kind: "Patients" | "Visits" | "Drugs" | "Reports";
  label: string;
  hint?: string;
  to: string;
};

const REPORTS: Result[] = [
  { kind: "Reports", label: "MOH 711 Monthly Summary", to: "/analytics" },
  { kind: "Reports", label: "DHIS2 Data Export", to: "/analytics" },
  { kind: "Reports", label: "NHIF Claims Report", to: "/analytics" },
  { kind: "Reports", label: "Drug Consumption Report", to: "/analytics" },
];

const ICONS = {
  Patients: User,
  Visits: Stethoscope,
  Drugs: Pill,
  Reports: FileBarChart2,
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: Result[] = [];

    for (const p of patients) {
      if (
        p.name.toLowerCase().includes(term) ||
        p.nationalId.includes(term)
      ) {
        out.push({
          kind: "Patients",
          label: p.name,
          hint: `ID ${p.nationalId}`,
          to: `/patients/${p.id}`,
        });
      }
      for (const v of p.visits) {
        if (v.diagnosis.toLowerCase().includes(term)) {
          out.push({
            kind: "Visits",
            label: `${v.diagnosis}`,
            hint: `${p.name} · ${v.date}`,
            to: `/patients/${p.id}`,
          });
        }
      }
    }
    for (const d of initialDrugs) {
      if (d.name.toLowerCase().includes(term)) {
        out.push({
          kind: "Drugs",
          label: d.name,
          hint: `${d.stock} ${d.unit} in stock`,
          to: "/pharmacy",
        });
      }
    }
    for (const r of REPORTS) {
      if (r.label.toLowerCase().includes(term)) out.push(r);
    }
    return out.slice(0, 24);
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Result[]> = {};
    for (const r of results) (g[r.kind] ||= []).push(r);
    return g;
  }, [results]);

  return (
    <div className="relative hidden flex-1 max-w-md md:block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search patients, visits, drugs, reports…"
        className="h-9 pl-8"
      />
      {open && q && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-96 overflow-auto rounded-md border bg-popover shadow-lg">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No results for "{q}"
            </div>
          ) : (
            Object.entries(grouped).map(([kind, items]) => {
              const Icon = ICONS[kind as keyof typeof ICONS];
              return (
                <div key={kind} className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {kind}
                  </div>
                  {items.map((r, i) => (
                    <button
                      key={kind + i}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        navigate({ to: r.to });
                        setOpen(false);
                        setQ("");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/10"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate">{r.label}</span>
                      {r.hint && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {r.hint}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
