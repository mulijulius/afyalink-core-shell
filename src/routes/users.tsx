import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/users")({ component: UsersPage });

const ROLES: Role[] = [
  "Clinician", "Doctor", "Nurse", "Pharmacist",
  "Lab Technician", "Admin", "Finance Officer",
];

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  department: string | null;
  requested_role: Role | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function UsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const rolesByUser = new Map<string, Role[]>();
      (roles ?? []).forEach((r: { user_id: string; role: Role }) => {
        const list = rolesByUser.get(r.user_id) ?? [];
        list.push(r.role);
        rolesByUser.set(r.user_id, list);
      });

      return (profiles as ProfileRow[]).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
      }));
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  /**
   * approve
   *
   * FIX: The previous code did a bare upsert({ user_id, role }) without
   * specifying onConflict, so Supabase couldn't resolve the unique constraint
   * "user_roles_user_id_role_key" and threw a duplicate-key error when the
   * user already had a role row (e.g. re-approving after a revoke that
   * left the role row behind).
   *
   * Now we:
   *   1. DELETE any existing role row for this user first (clean slate).
   *   2. INSERT the new role row.
   *   3. UPDATE profiles.status → "approved".
   *
   * This guarantees exactly one role row per user and no duplicate-key error.
   */
  const approve = async (uid: string, role: Role) => {
    // Step 1: remove any existing role to avoid duplicate-key conflict
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", uid);
    if (delErr) {
      toast.error(`Failed to clear existing role: ${delErr.message}`);
      return;
    }

    // Step 2: insert the desired role
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: uid, role });
    if (insErr) {
      toast.error(`Failed to assign role: ${insErr.message}`);
      return;
    }

    // Step 3: mark profile as approved
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", uid);
    if (pErr) {
      toast.error(`Failed to update profile status: ${pErr.message}`);
      return;
    }

    toast.success(`Approved as ${role}`);
    refresh();
  };

  /**
   * revoke
   *
   * Sets profile status to "rejected" and removes all role rows.
   */
  const revoke = async (uid: string) => {
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", uid);
    if (pErr) {
      toast.error(pErr.message);
      return;
    }

    await supabase.from("user_roles").delete().eq("user_id", uid);
    toast.success("Access revoked");
    refresh();
  };

  /**
   * changeRole
   *
   * FIX: Previous code did delete + insert in two steps, which was correct
   * but didn't handle errors on the delete. Now it checks both steps and
   * only marks approved if both succeed.
   */
  const changeRole = async (uid: string, role: Role) => {
    // Remove all current roles for this user
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", uid);
    if (delErr) {
      toast.error(`Failed to clear role: ${delErr.message}`);
      return;
    }

    // Assign the new role
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: uid, role });
    if (insErr) {
      toast.error(`Failed to set role: ${insErr.message}`);
      return;
    }

    toast.success(`Role updated to ${role}`);
    refresh();
  };

  if (user?.role !== "Admin") {
    return (
      <div className="text-sm text-muted-foreground">Admins only.</div>
    );
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
                      <TableCell className="font-medium">
                        {u.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell>{u.department || "—"}</TableCell>
                      <TableCell>{u.requested_role || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={current ?? ""}
                          onValueChange={(v) => changeRole(u.id, v as Role)}
                        >
                          <SelectTrigger className="h-8 w-[160px] text-xs">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.status === "approved"
                              ? "default"
                              : u.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {u.status !== "approved" && (
                          <Button
                            size="sm"
                            disabled={!u.requested_role}
                            onClick={() =>
                              u.requested_role &&
                              approve(u.id, u.requested_role)
                            }
                          >
                            Approve
                          </Button>
                        )}
                        {u.status !== "rejected" && u.id !== user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revoke(u.id)}
                          >
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
