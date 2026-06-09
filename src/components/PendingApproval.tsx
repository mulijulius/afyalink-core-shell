import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

export function PendingApproval() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">
          {user?.status === "rejected" ? "Access request was declined" : "Awaiting Admin approval"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hi {user?.name}, your account for <span className="font-medium text-foreground">{user?.facility}</span> has been created.
          {user?.status === "pending" && <> An administrator will review your request and assign your role
          {user?.requestedRole ? <> ({user.requestedRole})</> : null}.</>}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={refresh} className="bg-[#0057A8] hover:bg-[#004a8f]">Check status</Button>
          <Button variant="outline" onClick={async () => { await logout(); navigate({ to: "/login" }); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
