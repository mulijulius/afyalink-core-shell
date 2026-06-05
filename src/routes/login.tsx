import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Stethoscope, HeartPulse, Pill, FlaskConical, ShieldCheck, Wallet, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const ROLE_CARDS: { role: Role; icon: typeof Stethoscope; tint: string }[] = [
  { role: "Clinician",        icon: Stethoscope,  tint: "text-[#0057A8] bg-[#0057A8]/10" },
  { role: "Nurse",            icon: HeartPulse,   tint: "text-rose-600 bg-rose-100" },
  { role: "Pharmacist",       icon: Pill,         tint: "text-emerald-600 bg-emerald-100" },
  { role: "Lab Technician",   icon: FlaskConical, tint: "text-violet-600 bg-violet-100" },
  { role: "Admin",            icon: ShieldCheck,  tint: "text-amber-600 bg-amber-100" },
  { role: "Finance Officer",  icon: Wallet,       tint: "text-sky-600 bg-sky-100" },
];

function LoginPage() {
  const { setEmail, setRole } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"login" | "role">("login");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !password) return;
    setEmail(emailInput);
    setStep("role");
  };

  const pickRole = (r: Role) => {
    setRole(r);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="h-12 w-12 rounded-xl bg-[#0057A8] text-white font-bold flex items-center justify-center text-xl shadow-lg">
              A
            </div>
            <span className="text-3xl" aria-label="Kenya">🇰🇪</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">AfyaLink HMS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Facility: Kenyatta County Hospital
          </p>
        </div>

        {step === "login" ? (
          <Card className="max-w-md mx-auto shadow-xl border-slate-200">
            <CardContent className="p-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" type="email" required autoFocus
                    placeholder="you@kch.go.ke"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password" type="password" required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-[#0057A8] hover:bg-[#004a8f]">
                  Login
                </Button>
                <div className="text-center">
                  <button type="button" className="text-sm text-[#0057A8] hover:underline">
                    Forgot Password?
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="text-center mb-5">
              <h2 className="text-lg font-medium">Select your role</h2>
              <p className="text-xs text-muted-foreground">Demo mode — choose how you want to sign in.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ROLE_CARDS.map(({ role, icon: Icon, tint }) => (
                <button
                  key={role}
                  onClick={() => pickRole(role)}
                  className="group text-left rounded-xl border bg-white p-4 hover:border-[#0057A8] hover:shadow-md transition-all"
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tint}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 font-medium">{role}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Role-based access
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Ministry of Health · Republic of Kenya
        </p>
      </div>
    </div>
  );
}
