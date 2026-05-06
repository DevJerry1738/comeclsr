import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
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

  const { data: allUsers, refetch } = trpc.admin.allUsers.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateUser = trpc.admin.updateUser.useMutation({ onSuccess: () => { toast.success("User updated"); refetch(); } });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => { toast.success("User deleted"); refetch(); } });
  const resetPassword = trpc.admin.resetPassword.useMutation({ onSuccess: () => { toast.success("Password reset"); setNewPassword(""); } });

  const filteredUsers = allUsers?.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
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
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Payment</th>
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">KYC</th>
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Chat</th>
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Agent</th>
                  <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-800/50 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium">{u.fullName?.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium">{u.fullName || u.username}</p>
                          <p className="text-xs text-neutral-500">{u.email}</p>
                          <p className="text-xs text-neutral-600">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><Badge className={getStatusColor(u.status)}>{u.status}</Badge></td>
                    <td className="p-4"><Badge className={getStatusColor(u.paymentStatus)}>{u.paymentStatus}</Badge></td>
                    <td className="p-4"><Badge className={getStatusColor(u.kycStatus)}>{u.kycStatus}</Badge></td>
                    <td className="p-4"><Badge className={getStatusColor(u.conversationStatus)}>{u.conversationStatus}</Badge></td>
                    <td className="p-4"><span className="text-sm text-neutral-400">{u.assignedAgent?.displayName || "—"}</span></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-white" onClick={() => { setSelectedUser(u); setShowDetail(true); }}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-amber-400" onClick={() => updateUser.mutate({ id: u.id, status: u.status === "suspended" ? "active" : "suspended" })}><Ban className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400" onClick={() => confirm("Delete this user?") && deleteUser.mutate({ id: u.id })}><Trash2 className="w-4 h-4" /></Button>
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
                <div><p className="text-xs text-neutral-500">Full Name</p><p className="text-sm">{selectedUser.fullName}</p></div>
                <div><p className="text-xs text-neutral-500">Username</p><p className="text-sm">{selectedUser.username}</p></div>
                <div><p className="text-xs text-neutral-500">Email</p><p className="text-sm">{selectedUser.email}</p></div>
                <div><p className="text-xs text-neutral-500">Phone</p><p className="text-sm">{selectedUser.phone || "—"}</p></div>
                <div><p className="text-xs text-neutral-500">Gender</p><p className="text-sm">{selectedUser.gender || "—"}</p></div>
                <div><p className="text-xs text-neutral-500">Age</p><p className="text-sm">{selectedUser.age || "—"}</p></div>
                <div><p className="text-xs text-neutral-500">Location</p><p className="text-sm">{selectedUser.location || "—"}</p></div>
                <div><p className="text-xs text-neutral-500">Interests</p><p className="text-sm">{selectedUser.interests || "—"}</p></div>
              </div>

              {selectedUser.kyc && (
                <div className="p-4 rounded-lg bg-neutral-800/50 space-y-2">
                  <p className="font-medium text-sm">KYC Responses</p>
                  <p className="text-xs text-neutral-400"><span className="text-neutral-500">People Type:</span> {selectedUser.kyc.peopleType || "—"}</p>
                  <p className="text-xs text-neutral-400"><span className="text-neutral-500">Conversation Type:</span> {selectedUser.kyc.conversationType || "—"}</p>
                  <p className="text-xs text-neutral-400"><span className="text-neutral-500">Personality Prefs:</span> {selectedUser.kyc.personalityPrefs || "—"}</p>
                  <p className="text-xs text-neutral-400"><span className="text-neutral-500">Expectations:</span> {selectedUser.kyc.expectations || "—"}</p>
                </div>
              )}

              <div className="flex gap-3">
                <select className="p-2 rounded bg-neutral-800 border border-neutral-700 text-sm text-white" onChange={e => updateUser.mutate({ id: selectedUser.id, status: e.target.value as any })} defaultValue={selectedUser.status}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                </select>
                <select className="p-2 rounded bg-neutral-800 border border-neutral-700 text-sm text-white" onChange={e => updateUser.mutate({ id: selectedUser.id, paymentStatus: e.target.value as any })} defaultValue={selectedUser.paymentStatus}>
                  <option value="pending">Payment Pending</option>
                  <option value="approved">Payment Approved</option>
                  <option value="rejected">Payment Rejected</option>
                </select>
                <select className="p-2 rounded bg-neutral-800 border border-neutral-700 text-sm text-white" onChange={e => updateUser.mutate({ id: selectedUser.id, kycStatus: e.target.value as any })} defaultValue={selectedUser.kycStatus}>
                  <option value="pending">KYC Pending</option>
                  <option value="submitted">KYC Submitted</option>
                  <option value="approved">KYC Approved</option>
                  <option value="rejected">KYC Rejected</option>
                </select>
                <select className="p-2 rounded bg-neutral-800 border border-neutral-700 text-sm text-white" onChange={e => updateUser.mutate({ id: selectedUser.id, conversationStatus: e.target.value as any })} defaultValue={selectedUser.conversationStatus}>
                  <option value="pending">Chat Pending</option>
                  <option value="assigned">Chat Assigned</option>
                  <option value="active">Chat Active</option>
                  <option value="stopped">Chat Stopped</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-neutral-500" />
                <input className="flex-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm text-white" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} type="text" />
                <Button size="sm" onClick={() => newPassword && resetPassword.mutate({ id: selectedUser.id, newPassword })} className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30">Reset</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
