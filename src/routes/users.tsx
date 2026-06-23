import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/users")({ component: UsersPage });

const ROLES: Role[] = ["Clinician", "Doctor", "Nurse", "Pharmacist", "Lab Technician", "Admin", "Finance Officer"];

type ProfileRow = {
  id: string; email: string; full_name: string; phone: string | null;
  department: string | null; requested_role: Role | null;
  status: "pending" | "approved" | "rejected"; created_at: string;
};

function UsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const rolesByUser = new Map<string, Role[]>();
      (roles ?? []).forEach((r: { user_id: string; role: Role }) => {
        const list = rolesByUser.get(r.user_id) ?? [];
        list.push(r.role); rolesByUser.set(r.user_id, list);
      });
      return (profiles as ProfileRow[]).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const approve = async (uid: string, role: Role) => {
    const { error: rErr } = await supabase.from("user_roles").upsert({ user_id: uid, role });
    if (rErr) { toast.error(rErr.message); return; }
    const { error: pErr } = await supabase.from("profiles").update({ status: "approved" }).eq("id", uid);
    if (pErr) { toast.error(pErr.message); return; }
    toast.success(`Approved as ${role}`); refresh();
  };

  const reject = async (uid: string) => {
    const { error } = await supabase.from("profiles").update({ status: "rejected" }).eq("id", uid);
    if (error) { toast.error(error.message); return; }
    await supabase.from("user_roles").delete().eq("user_id", uid);
    toast.success("Access revoked"); refresh();
  };

  const changeRole = async (uid: string, role: Role) => {
    await supabase.from("user_roles").delete().eq("user_id", uid);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) { toast.error(error.message); return; }
    toast.success(`Role set to ${role}`); refresh();
  };

  if (user?.role !== "Admin") {
    return <div className="text-sm text-muted-foreground">Admins only.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Current role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((u) => {
                  const current = u.roles[0];
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell>{u.department || "—"}</TableCell>
                      <TableCell>{u.requested_role || "—"}</TableCell>
                      <TableCell>
                        <Select value={current ?? ""} onValueChange={(v) => changeRole(u.id, v as Role)}>
                          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === "approved" ? "default" : u.status === "pending" ? "secondary" : "destructive"}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {u.status !== "approved" && (
                          <Button size="sm" disabled={!u.requested_role} onClick={() => u.requested_role && approve(u.id, u.requested_role)}>
                            Approve
                          </Button>
                        )}
                        {u.status !== "rejected" && u.id !== user.id && (
                          <Button size="sm" variant="outline" onClick={() => reject(u.id)}>
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
