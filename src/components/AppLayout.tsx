import { type ReactNode, useEffect } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { AccessDenied } from "@/components/AccessDenied";
import { PendingApproval } from "@/components/PendingApproval";
import { InstallBanner } from "@/components/InstallBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Toaster } from "@/components/ui/sonner";
import { useAuth, isRouteAllowed } from "@/lib/auth";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // "/" is the public marketing landing page and "/login" is the
  // sign-in/sign-up screen — both are reachable without a session.
  const isPublic = pathname === "/" || pathname === "/login";

  useEffect(() => {
    if (loading) return;
    // Logged-out users trying to reach a protected route get sent to /login.
    if (!user && !isPublic) { navigate({ to: "/login" }); return; }
    // Logged-in users who land on the marketing page or the login screen
    // are sent straight to their dashboard instead.
    if (user && isPublic) { navigate({ to: "/dashboard" }); return; }
  }, [user, loading, isPublic, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (isPublic && !user) {
    return (
      <>
        <OfflineIndicator />
        {children}
        <Toaster richColors position="top-right" />
      </>
    );
  }

  if (!user) {
    // Mid-redirect to /login.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (isPublic) {
    // Logged in, but still on "/" or "/login" — mid-redirect to /dashboard.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // Logged in but no approved role yet
  if (!user.role || user.status !== "approved") {
    return (
      <>
        <OfflineIndicator />
        <PendingApproval />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  const allowed = isRouteAllowed(user.role, pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <InstallBanner />
        <OfflineIndicator />
        <AppNavbar />
        <main className="flex-1 p-4 sm:p-6 print:p-0">
          {allowed ? children : <AccessDenied pathname={pathname} />}
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
