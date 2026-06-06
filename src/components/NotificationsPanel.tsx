import { Pill, FlaskConical, Share2, Receipt, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type N = {
  id: string;
  icon: React.ElementType;
  title: string;
  body: string;
  time: string;
  tone: "red" | "amber" | "blue" | "green";
};

const NOTIFS: N[] = [
  {
    id: "n1",
    icon: Pill,
    title: "Low stock alert",
    body: "Amoxicillin 500mg below reorder level (18/50 strips).",
    time: "5m ago",
    tone: "red",
  },
  {
    id: "n2",
    icon: FlaskConical,
    title: "Critical lab value",
    body: "Patient Wanjiku Kamau — Glucose 22.4 mmol/L.",
    time: "12m ago",
    tone: "red",
  },
  {
    id: "n3",
    icon: Share2,
    title: "New referral received",
    body: "Inbound referral from Kiambu Level 4 Hospital.",
    time: "1h ago",
    tone: "blue",
  },
  {
    id: "n4",
    icon: Receipt,
    title: "NHIF claim approved",
    body: "Claim CLM-00284 approved — KES 18,450.",
    time: "3h ago",
    tone: "green",
  },
  {
    id: "n5",
    icon: Clock,
    title: "Patient waiting over 2 hours",
    body: "Joseph Mutua has been in OPD queue since 09:14.",
    time: "now",
    tone: "amber",
  },
];

const toneClass = (t: N["tone"]) =>
  ({
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
  })[t];

export function NotificationsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            Notifications <Badge variant="secondary">{NOTIFS.length}</Badge>
          </SheetTitle>
          <SheetDescription>Recent system alerts and updates</SheetDescription>
        </SheetHeader>
        <div className="divide-y">
          {NOTIFS.map((n) => (
            <div key={n.id} className="flex gap-3 p-4 hover:bg-muted/40">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass(n.tone)}`}
              >
                <n.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {n.time}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
