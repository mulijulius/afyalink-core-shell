import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function AccessDenied({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role <span className="font-medium text-foreground">{user?.role}</span> does not
          have permission to view <code className="text-xs">{pathname}</code>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Contact your facility administrator if you believe this is an error.
        </p>
        <Button asChild className="mt-6 bg-[#0057A8] hover:bg-[#004a8f]">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
