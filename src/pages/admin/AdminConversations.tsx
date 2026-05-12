import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, CheckCircle, XCircle, MessageCircle, Eye } from "lucide-react";

export default function AdminConversations() {
  const { user, logout } = useAuth();
  const [viewConv, setViewConv] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ['conversations', 'all'],
    queryFn: () => rpc.conversation.allConversations(),
    enabled: user?.role === 'admin',
  });

  const { data: convMessages } = useQuery({
    queryKey: ['messages', viewConv],
    queryFn: () => rpc.conversation.getMessages(viewConv!),
    enabled: !!viewConv,
  });

  const approve = useMutation({
    mutationFn: (data: any) => rpc.agent.approveConversation(data.conversationId),
    onSuccess: () => {
      toast.success("Approved!");
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
    },
    onError: (err: any) => toast.error(err.message || "Approve failed"),
  });

  const stop = useMutation({
    mutationFn: (data: any) => rpc.agent.stopConversation(data.conversationId),
    onSuccess: () => {
      toast.success("Stopped!");
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
    },
    onError: (err: any) => toast.error(err.message || "Stop failed"),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "stopped": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
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
          <h1 className="font-semibold">Conversation Monitor</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6"><h2 className="text-xl font-bold">All Conversations</h2><p className="text-sm text-neutral-500">{conversations?.length || 0} total</p></div>

        <div className="grid md:grid-cols-2 gap-4">
          {conversations?.map((c) => (
            <Card key={c.id} className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-violet-400" />
                    <div><p className="font-medium text-sm">Conversation #{c.id}</p><p className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-neutral-500 text-xs">User</p><p className="text-white">{c.user?.fullName || `User #${c.userId}`}</p></div>
                  <div><p className="text-neutral-500 text-xs">Agent</p><p className="text-white">{c.agent?.displayName || `Agent #${c.agentId}`}</p></div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="border-neutral-700 text-xs" onClick={() => setViewConv(c.id)}><Eye className="w-3 h-3 mr-1" />View</Button>
                  {c.status === "pending" && !c.adminApproved && (
                    <Button size="sm" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" onClick={() => approve.mutate({ conversationId: c.id })}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                  )}
                  {c.status === "active" && (
                    <Button size="sm" className="bg-red-500/20 text-red-400 border border-red-500/30" onClick={() => stop.mutate({ conversationId: c.id })}><XCircle className="w-3 h-3 mr-1" />Stop</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!viewConv} onOpenChange={() => setViewConv(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Conversation #{viewConv}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {convMessages?.slice().reverse().map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.senderRole === "user" ? "bg-rose-500/20 text-white" : "bg-neutral-800 text-white"}`}>
                  <p className="text-xs text-neutral-500 mb-1">{msg.senderRole}</p>
                  {msg.type === "voice" ? <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400" />Voice Note ({msg.duration || 0}s)</p> : <p>{msg.content}</p>}
                  <p className="text-[10px] text-neutral-600 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
