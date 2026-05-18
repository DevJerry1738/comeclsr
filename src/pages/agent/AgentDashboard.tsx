import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AvatarRing from "@/components/AvatarRing";
import {
  Heart, LogOut, MessageSquare, Mail, Phone, Clock,
  AlertCircle, Send, Play, ArrowLeft, Users, ChevronRight,
  Circle, CheckCheck, Check
} from "lucide-react";

export default function AgentDashboard() {
  const { user, logout, isAgent } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);

  const { data: assignedUsers = [], isLoading } = useQuery({
    queryKey: ["agent", "assignedUsers"],
    queryFn: () => rpc.agent.getAssignedUsers(),
    enabled: isAgent,
  });

  if (!user || !isAgent) return null;

  const selectedUser = assignedUsers.find((u: any) => u.user_id === selectedUserId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "expired": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-neutral-700/50 text-neutral-400 border-neutral-700";
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    return days > 0 ? days : 0;
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowList(false);
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex-none border-b border-white/5 bg-neutral-900/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          {!showList && selectedUser && (
            <button
              onClick={() => setShowList(true)}
              className="md:hidden mr-1 text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-semibold text-sm leading-tight">ComeClsr</h1>
            <p className="text-[10px] text-neutral-500">Agent Portal</p>
          </div>
          {/* Mobile: show selected user name or title */}
          <div className="md:hidden">
            {selectedUser && !showList ? (
              <div>
                <p className="font-semibold text-sm leading-tight">{selectedUser.full_name}</p>
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
              </div>
            ) : (
              <h1 className="font-semibold">My Users</h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <AvatarRing name={user.full_name || user.email} size="sm" />
            <div>
              <p className="text-sm font-medium leading-tight">{user.full_name}</p>
              <p className="text-[10px] text-neutral-500">Agent</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Body: Split Pane */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: User List */}
        <aside className={`
          ${showList ? 'flex' : 'hidden'} md:flex
          flex-col w-full md:w-80 lg:w-96
          border-r border-white/5 bg-neutral-900/40
          overflow-hidden flex-none
        `}>
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm">Your Users</h2>
                <p className="text-xs text-neutral-500">{assignedUsers.length} assigned</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/30 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-neutral-700/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-neutral-700/50 rounded w-2/3" />
                      <div className="h-2 bg-neutral-700/30 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : assignedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-neutral-600" />
                </div>
                <p className="text-neutral-400 font-medium">No users assigned yet</p>
                <p className="text-xs text-neutral-600 mt-1">Users will appear here once assigned</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {assignedUsers.map((u: any) => (
                  <button
                    key={u.user_id}
                    onClick={() => handleSelectUser(u.user_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                      selectedUserId === u.user_id
                        ? "bg-rose-500/10 border border-rose-500/20"
                        : "hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <div className="flex-none">
                      <AvatarRing name={u.full_name || u.email} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-medium text-sm truncate">{u.full_name}</p>
                        <Badge className={`text-[10px] px-2 py-0 h-4 flex-none ${getStatusColor(u.subscription_status)}`}>
                          {u.subscription_status || "none"}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">{u.email}</p>
                      {u.subscription_expires_at && (
                        <p className="text-[10px] text-neutral-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {getDaysRemaining(u.subscription_expires_at)}d remaining
                        </p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-none transition-colors ${
                      selectedUserId === u.user_id ? "text-rose-400" : "text-neutral-700"
                    }`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT: Chat Area */}
        <main className={`
          ${!showList || selectedUserId ? 'flex' : 'hidden'} md:flex
          flex-col flex-1 overflow-hidden
        `}>
          {selectedUser ? (
            <AgentChatPanel
              user={selectedUser}
              getStatusColor={getStatusColor}
              getDaysRemaining={getDaysRemaining}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-600/10 border border-rose-500/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-rose-500/50" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-300 mb-2">Select a user to start</h3>
              <p className="text-sm text-neutral-600 max-w-xs">
                Choose a user from the list on the left to view their profile and chat with them.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Chat Panel Component
// ─────────────────────────────────────────────────
function AgentChatPanel({ user: selectedUser, getStatusColor, getDaysRemaining }: {
  user: any;
  getStatusColor: (s: string) => string;
  getDaysRemaining: (s: string | null) => number | null;
}) {
  const [messageInput, setMessageInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const queryClient = useQueryClient();
  const { user: agentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agentRecord, isLoading: agentLoading, error: agentError } = useQuery({
    queryKey: ["agentSelf", agentUser?.id],
    queryFn: () => rpc.agent.getSelf(),
    enabled: !!agentUser?.id,
  });

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["agentConversations", selectedUser.user_id, agentRecord?.id],
    queryFn: async () => {
      if (!agentRecord?.id) return [];
      return (await rpc.agent.getConversationWithUser(selectedUser.user_id)) || [];
    },
    enabled: !!agentRecord?.id,
  });

  const conversationId = conversations[0]?.id;

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["agentMessages", conversationId],
    queryFn: () => rpc.conversation.getMessages(conversationId),
    enabled: !!conversationId,
  });

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conversation_${conversationId}`)
      .on('broadcast', { event: 'new_message' }, () => {
        queryClient.invalidateQueries({ queryKey: ["agentMessages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["agentConversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => rpc.conversation.sendMessage(conversationId, content, "media"),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["agentMessages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["agentConversations"] });
      
      // Broadcast to other clients (like the user)
      if (conversationId) {
        supabase.channel(`conversation_${conversationId}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: { conversationId: conversationId }
        });
      }
    },
    onError: (e: any) => toast.error(e.message || "Failed to send"),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversationId) return;
    sendMutation.mutate(messageInput.trim());
  };

  const isInactive = selectedUser.subscription_status !== "active";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex-none px-4 py-3 border-b border-white/5 bg-neutral-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarRing name={selectedUser.full_name || selectedUser.email} size="md" />
          <div>
            <p className="font-semibold text-sm">{selectedUser.full_name}</p>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] px-2 py-0 h-4 ${getStatusColor(selectedUser.subscription_status)}`}>
                {selectedUser.subscription_status || "none"}
              </Badge>
              {selectedUser.subscription_expires_at && (
                <span className="text-[10px] text-neutral-500">
                  {getDaysRemaining(selectedUser.subscription_expires_at)}d left
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(p => !p)}
          className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-rose-500/10 text-rose-400' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
          title="User info"
        >
          <AlertCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Info panel slide-in */}
      {showInfo && (
        <div className="flex-none px-4 py-4 bg-neutral-900/60 border-b border-white/5 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-xs text-neutral-200 flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-neutral-500 flex-none" />{selectedUser.email}
              </p>
            </div>
            {selectedUser.phone && (
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-xs text-neutral-200 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-neutral-500 flex-none" />{selectedUser.phone}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1">Assigned</p>
              <p className="text-xs text-neutral-200 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-neutral-500 flex-none" />
                {new Date(selectedUser.assigned_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inactive warning */}
      {isInactive && (
        <div className="flex-none mx-4 mt-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <p className="text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-none" />
            User's subscription is <strong>{selectedUser.subscription_status || "inactive"}</strong>. They can't send or receive messages.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {agentLoading || convsLoading || messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-neutral-700 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-neutral-500">Loading conversation...</p>
            </div>
          </div>
        ) : agentError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-500/60 mx-auto mb-3" />
              <p className="text-sm text-red-400">Failed to load agent record</p>
            </div>
          </div>
        ) : !conversationId ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-400 font-medium">No conversation yet</p>
              <p className="text-xs text-neutral-600 mt-1">Will appear once the user initiates contact</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-neutral-400">No messages yet</p>
              <p className="text-xs text-neutral-600 mt-1">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((msg: any, i: number) => {
            const isAgent = msg.sender_role === "agent";
            return (
              <div key={i} className={`flex gap-2.5 ${isAgent ? "justify-end" : "justify-start"}`}>
                {!isAgent && (
                  <div className="flex-none self-end">
                    <AvatarRing name={selectedUser.full_name} size="sm" />
                  </div>
                )}
                <div className={`max-w-[72%] md:max-w-sm ${isAgent ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isAgent
                      ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-sm"
                      : "bg-neutral-800/70 border border-white/5 text-neutral-100 rounded-bl-sm"
                  }`}>
                    {msg.type === "voice" && msg.media_url ? (
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        <audio controls src={msg.media_url} className="h-8 max-w-[200px]" />
                      </div>
                    ) : msg.media_url && msg.media_url.startsWith("http") ? (
                      <div>
                        <img src={msg.media_url} alt="media" className="rounded-lg max-w-full mb-1" />
                        {msg.content && <p>{msg.content}</p>}
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 px-1 ${isAgent ? "flex-row-reverse" : ""}`}>
                    <span className="text-[10px] text-neutral-600">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isAgent && (
                      msg.is_read
                        ? <CheckCheck className="w-3 h-3 text-rose-400" />
                        : <Check className="w-3 h-3 text-neutral-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-none px-4 py-3 border-t border-white/5 bg-neutral-900/40">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={isInactive ? "User subscription inactive..." : "Type a message..."}
            disabled={isInactive || !conversationId}
            style={{ backgroundColor: '#1c1c1e', color: '#ffffff' }}
            className="flex-1 border border-neutral-700 rounded-2xl px-4 py-3 text-sm placeholder-neutral-600 focus:outline-none focus:border-rose-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!messageInput.trim() || sendMutation.isPending || isInactive || !conversationId}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/20 disabled:opacity-30 flex-none transition-all hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
