import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, Search, Eye, Ban, Trash2, KeyRound } from "lucide-react";

export default function AdminUsers() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const queryClient = useQueryClient();

  const { data: allUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => rpc.admin.getUsers(),
    enabled: user?.role === 'admin',
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateUser = useMutation({
    mutationFn: (updates: any) => rpc.admin.updateUser(updates.id, updates),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => toast.error(err.message || "Update failed"),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => rpc.admin.deleteUser(userId),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => toast.error(err.message || "Delete failed"),
  });

  const resetPassword = useMutation({
    mutationFn: (data: any) => rpc.admin.resetPassword(data.id, data.newPassword),
    onSuccess: () => {
      toast.success("Password reset");
      setNewPassword("");
    },
    onError: (err: any) => toast.error(err.message || "Reset failed"),
  });

  const filteredUsers = allUsers?.filter((u: any) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "suspended": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "blocked": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-neutral-500/20 text-neutral-400";
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <h1 className="font-semibold">User Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-bold">All Users</h2><p className="text-sm text-neutral-500">{filteredUsers?.length || 0} total</p></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input className="pl-10 pr-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm w-64" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <Card className="bg-neutral-900/60 border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 text-left">
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">User</th>
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Credit Balance</th>
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((u: any) => (
                  <tr key={u.id} className="border-b border-neutral-800/50 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium">{u.full_name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium">{u.full_name || u.username}</p>
                          <p className="text-xs text-neutral-500">{u.email}</p>
                          <p className="text-xs text-neutral-600">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                        {Number(u.credit_balance || 0).toFixed(2)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-white" onClick={() => { setSelectedUser(u); setShowDetail(true); }}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400" onClick={() => confirm("Are you sure you want to completely delete this user? This cannot be undone.") && deleteUser.mutate(u.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-neutral-500">Full Name</p><p className="text-sm">{selectedUser.full_name}</p></div>
                <div><p className="text-xs text-neutral-500">Username</p><p className="text-sm">{selectedUser.username}</p></div>
                <div><p className="text-xs text-neutral-500">Email</p><p className="text-sm">{selectedUser.email}</p></div>
                <div><p className="text-xs text-neutral-500">Created</p><p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p></div>
              </div>

              <div className="border-t border-neutral-800 pt-4">
                <h3 className="text-sm font-medium mb-3 text-neutral-400 uppercase tracking-wide text-xs">Account Management</h3>
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-neutral-500" />
                  <input className="flex-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-rose-500/50" placeholder="Type a new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} type="text" />
                  <Button size="sm" onClick={() => newPassword && resetPassword.mutate({ id: selectedUser.id, newPassword })} className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30">Reset Password</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
