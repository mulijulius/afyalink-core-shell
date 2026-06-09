import { useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useAuth } from "@/lib/auth";

export function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background px-3 sm:px-4 print:hidden">
      <SidebarTrigger />
      <div className="hidden min-w-0 md:flex md:flex-col">
        <h1 className="truncate text-sm font-semibold">Kapsabet Referral Hospital</h1>
        <p className="text-xs text-muted-foreground">Facility · Nandi County</p>
      </div>
      <div className="flex-1" />
      <GlobalSearch />
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
          onClick={() => setNotifOpen(true)}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.initials ?? "DM"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium">{user?.name ?? "Guest"}</span>
            <Badge
              variant="secondary"
              className="w-fit border-accent/30 bg-accent/10 px-1.5 py-0 text-[10px] font-medium text-accent"
            >
              {user?.role ?? "—"}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Log out" onClick={onLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </header>
  );
}
