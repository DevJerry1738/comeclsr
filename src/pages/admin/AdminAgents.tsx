import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, Plus, UserPlus, MessageSquare } from "lucide-react";

export default function AdminAgents() {
  const { user, logout } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentForm, setAgentForm] = useState({ username: "", password: "", displayName: "", bio: "", profilePhoto: "" });
  const [welcomeMsg, setWelcomeMsg] = useState("");

  const { data: agents, refetch } = trpc.agent.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: allUsers } = trpc.admin.allUsers.useQuery(undefined, { enabled: user?.role === "admin" });
  const createAgent = trpc.agent.create.useMutation({ onSuccess: () => { toast.success("Agent created!"); setShowCreate(false); setAgentForm({ username: "", password: "", displayName: "", bio: "", profilePhoto: "" }); refetch(); } });
  const assignAgent = trpc.agent.assignToUser.useMutation({ onSuccess: () => { toast.success("Agent assigned!"); setShowAssign(false); refetch(); } });
  const setWelcome = trpc.agent.setWelcomeMessage.useMutation({ onSuccess: () => { toast.success("Welcome message set!"); setWelcomeMsg(""); } });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <h1 className="font-semibold">Agent Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-bold">Agents</h2><p className="text-sm text-neutral-500">{agents?.length || 0} total</p></div>
          <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-rose-500 to-pink-600"><Plus className="w-4 h-4 mr-2" />Create Agent</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.map((agent) => (
            <Card key={agent.id} className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">{agent.displayName.charAt(0)}</div>
                  <div>
                    <p className="font-medium">{agent.displayName}</p>
                    <p className="text-xs text-neutral-500">@{agent.username}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-400">{agent.bio || "No bio set"}</p>
                <div className="flex items-center gap-2">
                  <Badge className={agent.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-500/20 text-neutral-400"}>{agent.status}</Badge>
                  {agent.assignedUserId && <Badge className="bg-blue-500/20 text-blue-400">Assigned</Badge>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="border-neutral-700 text-xs" onClick={() => { setSelectedAgent(agent); setShowAssign(true); }}><UserPlus className="w-3 h-3 mr-1" />Assign</Button>
                  <Button size="sm" variant="outline" className="border-neutral-700 text-xs" onClick={() => { setSelectedAgent(agent); }}><MessageSquare className="w-3 h-3 mr-1" />Welcome Msg</Button>
                </div>
                {selectedAgent?.id === agent.id && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <input className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-sm text-white" placeholder="Welcome message..." value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)} />
                    <Button size="sm" className="w-full bg-rose-500/20 text-rose-400 border border-rose-500/30" onClick={() => welcomeMsg && setWelcome.mutate({ agentId: agent.id, content: welcomeMsg, isDefault: true })}>Set Message</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader><DialogTitle>Create New Agent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <input className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" placeholder="Username" value={agentForm.username} onChange={e => setAgentForm({...agentForm, username: e.target.value})} />
            <input className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" placeholder="Password" value={agentForm.password} onChange={e => setAgentForm({...agentForm, password: e.target.value})} type="text" />
            <input className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" placeholder="Display Name" value={agentForm.displayName} onChange={e => setAgentForm({...agentForm, displayName: e.target.value})} />
            <input className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" placeholder="Bio" value={agentForm.bio} onChange={e => setAgentForm({...agentForm, bio: e.target.value})} />
            <input className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" placeholder="Profile Photo URL" value={agentForm.profilePhoto} onChange={e => setAgentForm({...agentForm, profilePhoto: e.target.value})} />
            <Button onClick={() => createAgent.mutate(agentForm)} className="w-full bg-gradient-to-r from-rose-500 to-pink-600">Create Agent</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Agent to User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-neutral-400">Select a user to assign {selectedAgent?.displayName} to:</p>
            {allUsers?.filter(u => u.role === "user" && u.paymentStatus === "approved" && u.kycStatus === "approved").map((u) => (
              <button key={u.id} className="w-full text-left p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors flex items-center justify-between" onClick={() => selectedAgent && assignAgent.mutate({ agentId: selectedAgent.id, userId: u.id })}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs">{u.fullName?.charAt(0)}</div>
                  <div><p className="text-sm font-medium">{u.fullName || u.username}</p><p className="text-xs text-neutral-500">{u.email}</p></div>
                </div>
                <UserPlus className="w-4 h-4 text-rose-400" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
