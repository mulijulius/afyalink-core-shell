import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ListOrdered,
  Stethoscope,
  Pill,
  FlaskConical,
  Receipt,
  Share2,
  BarChart3,
  Settings,
  UserCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, ALLOWED_ROUTES } from "@/lib/auth";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "OPD Queue", url: "/opd-queue", icon: ListOrdered },
  { title: "Clinical Workspace", url: "/clinical", icon: Stethoscope },
  { title: "Pharmacy", url: "/pharmacy", icon: Pill },
  { title: "Laboratory", url: "/laboratory", icon: FlaskConical },
  { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Referrals", url: "/referrals", icon: Share2 },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Users", url: "/users", icon: UserCog },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const allowed = user?.role ? ALLOWED_ROUTES[user.role] : items.map((i) => i.url);
  const visible = items.filter((i) => allowed.includes(i.url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            A
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-tight">
              AfyaLink HMS <span aria-label="Kenya">🇰🇪</span>
            </span>
            <span className="text-xs text-muted-foreground">Hospital System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
