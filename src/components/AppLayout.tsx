import { type ReactNode, useEffect } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { AccessDenied } from "@/components/AccessDenied";
import { InstallBanner } from "@/components/InstallBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Toaster } from "@/components/ui/sonner";
import { useAuth, isRouteAllowed } from "@/lib/auth";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const isPublic = pathname === "/login";

  useEffect(() => {
    if (!user && !isPublic) navigate({ to: "/login" });
  }, [user, isPublic, navigate]);

  if (isPublic || !user) {
    return (
      <>
        <OfflineIndicator />
        {children}
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
