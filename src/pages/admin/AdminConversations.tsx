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

// Shape returned by conversation_all_conversations RPC
interface Conversation {
  id: number;
  user_id: string;
  user_name: string;       // flat field from RPC
  agent_id: number;
  agent_name: string;      // flat field from RPC
  status: string;
  admin_approved: boolean;
  last_message_at: string;
  created_at: string;
}

// Shape returned by conversation_get_messages RPC
interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  sender_role: string;
  type: string;
  content: string;
  media_url: string;
  duration: number;
  is_read: boolean;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  stopped: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  closed:  "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
};

export default function AdminConversations() {
  const { user, logout } = useAuth();
  const [viewConv, setViewConv] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations", "all"],
    queryFn: () => rpc.conversation.allConversations(),
    enabled: user?.role === "admin",
  });

  const { data: convMessages } = useQuery<Message[]>({
    queryKey: ["messages", viewConv],
    queryFn: () => rpc.conversation.getMessages(viewConv!),
    enabled: !!viewConv,
  });

  const approve = useMutation({
    mutationFn: (conversationId: number) => rpc.agent.approveConversation(conversationId),
    onSuccess: () => {
      toast.success("Conversation approved!");
      queryClient.invalidateQueries({ queryKey: ["conversations", "all"] });
    },
    onError: (err: any) => toast.error(err.message || "Approve failed"),
  });

  const stop = useMutation({
    mutationFn: (conversationId: number) => rpc.agent.stopConversation(conversationId),
    onSuccess: () => {
      toast.success("Conversation stopped.");
      queryClient.invalidateQueries({ queryKey: ["conversations", "all"] });
    },
    onError: (err: any) => toast.error(err.message || "Stop failed"),
  });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold">Conversation Monitor</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">All Conversations</h2>
          <p className="text-sm text-neutral-500">
            {isLoading
              ? "Loading..."
              : `${conversations?.length ?? 0} total · ${conversations?.filter((c) => c.status === "active").length ?? 0} active`}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6">
            <p className="text-red-400 text-sm">
              <strong>Error loading conversations:</strong>{" "}
              {error instanceof Error ? error.message : String(error)}
            </p>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">Loading conversations...</p>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !error && (!conversations || conversations.length === 0) && (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">No conversations yet.</p>
          </Card>
        )}

        {/* Conversation cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {(conversations ?? []).map((c) => (
            <Card key={c.id} className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-6 space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-violet-400" />
                    <div>
                      <p className="font-medium text-sm">Conversation #{c.id}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[c.status] ?? "bg-neutral-500/20 text-neutral-400"}>
                    {c.status}
                  </Badge>
                </div>

                {/* User / Agent */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500 text-xs">User</p>
                    {/* RPC returns flat user_name — not a nested user object */}
                    <p className="text-white">{c.user_name || `User #${c.user_id?.slice(0, 8)}`}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-xs">Agent</p>
                    {/* RPC returns flat agent_name — not a nested agent object */}
                    <p className="text-white">{c.agent_name || `Agent #${c.agent_id}`}</p>
                  </div>
                </div>

                {/* Last message */}
                <p className="text-xs text-neutral-500">
                  Last activity: {new Date(c.last_message_at).toLocaleString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-xs"
                    onClick={() => setViewConv(c.id)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>

                  {c.status === "pending" && !c.admin_approved && (
                    <Button
                      size="sm"
                      className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                      onClick={() => approve.mutate(c.id)}
                      disabled={approve.isPending}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                  )}

                  {c.status === "active" && (
                    <Button
                      size="sm"
                      className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                      onClick={() => stop.mutate(c.id)}
                      disabled={stop.isPending}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Stop
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Message viewer dialog */}
      <Dialog open={!!viewConv} onOpenChange={() => setViewConv(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation #{viewConv}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!convMessages || convMessages.length === 0 ? (
              <p className="text-neutral-400 text-sm text-center py-4">No messages yet.</p>
            ) : (
              [...convMessages].reverse().map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      msg.sender_role === "user"
                        ? "bg-rose-500/20 text-white"
                        : "bg-neutral-800 text-white"
                    }`}
                  >
                    <p className="text-xs text-neutral-500 mb-1 capitalize">{msg.sender_role}</p>
                    {msg.type === "voice" ? (
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Voice Note ({msg.duration || 0}s)
                      </p>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <p className="text-[10px] text-neutral-600 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
