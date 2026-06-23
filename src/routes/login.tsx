import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

const ROLES: Role[] = ["Clinician", "Doctor", "Nurse", "Pharmacist", "Lab Technician", "Admin", "Finance Officer"];

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  // sign in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // sign up
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [requestedRole, setRequestedRole] = useState<Role | "">("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    navigate({ to: "/" });
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedRole) { toast.error("Please pick a role"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone,
          department,
          requested_role: requestedRole,
        },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — waiting for Admin approval");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="h-12 w-12 rounded-xl bg-[#0057A8] text-white font-bold flex items-center justify-center text-xl shadow-lg">A</div>
            <span className="text-3xl" aria-label="Kenya">🇰🇪</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">AfyaLink HMS</h1>
          <p className="text-sm text-muted-foreground mt-1">Facility: Kapsabet Referral Hospital</p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardContent className="p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@kapsabet.go.ke" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full bg-[#0057A8] hover:bg-[#004a8f]">
                    {busy ? "Signing in…" : "Login"}
                  </Button>
                  <div className="text-center">
                    <Link to="/login" className="text-sm text-[#0057A8] hover:underline">Forgot Password?</Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fn">Full name</Label>
                    <Input id="fn" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Wanjiru" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ph">Phone</Label>
                      <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254…" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dept">Department</Label>
                      <Input id="dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="OPD" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Requested role</Label>
                    <Select value={requestedRole} onValueChange={(v) => setRequestedRole(v as Role)}>
                      <SelectTrigger><SelectValue placeholder="Choose role" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-pw">Password</Label>
                    <Input id="su-pw" type="password" required minLength={6} value={suPassword} onChange={(e) => setSuPassword(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full bg-[#0057A8] hover:bg-[#004a8f]">
                    {busy ? "Creating…" : "Create account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    New accounts require Admin approval before access is granted.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ministry of Health · Republic of Kenya
        </p>
      </div>
    </div>
  );
}