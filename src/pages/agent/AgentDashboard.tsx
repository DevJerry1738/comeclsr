import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Heart, LogOut, MessageSquare, Mail, Phone, Clock, AlertCircle, Send, Image, Mic, Play, ArrowDown } from "lucide-react";

export default function AgentDashboard() {
  const { user, logout, isAgent } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const queryClient = useQueryClient();

  const { data: assignedUsers = [], isLoading, error } = useQuery({
    queryKey: ["agent", "assignedUsers"],
    queryFn: () => rpc.agent.getAssignedUsers(),
    enabled: isAgent,
  });

  if (!user || !isAgent) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center">
        <Card className="bg-neutral-900/80 border-neutral-800 max-w-md">
          <CardContent className="pt-6">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">Error Loading Data</h3>
                <p className="text-sm text-neutral-400 mb-4">{error.message || "Failed to load assigned users"}</p>
                <Button onClick={() => navigate("/")} size="sm">
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedUser = assignedUsers.find((u: any) => u.user_id === selectedUserId);
  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "expired":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-neutral-500/20 text-neutral-400";
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Agent Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">{user.full_name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Assigned Users List */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold mb-4">Your Users ({assignedUsers.length})</h2>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-neutral-800/50 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : assignedUsers.length === 0 ? (
              <Card className="bg-neutral-900/60 border-neutral-800">
                <CardContent className="pt-6 text-center">
                  <MessageSquare className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                  <p className="text-neutral-400">No users assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {assignedUsers.map((assignedUser: any) => (
                  <Card
                    key={assignedUser.user_id}
                    className={`bg-neutral-900/60 border cursor-pointer transition ${
                      selectedUserId === assignedUser.user_id
                        ? "border-rose-500/50 bg-neutral-800/50"
                        : "border-neutral-800 hover:border-rose-500/30"
                    }`}
                    onClick={() => setSelectedUserId(assignedUser.user_id)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {assignedUser.full_name}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">
                            @{assignedUser.username}
                          </p>
                        </div>
                        <Badge
                          className={`text-xs whitespace-nowrap ${getSubscriptionColor(
                            assignedUser.subscription_status
                          )}`}
                        >
                          {assignedUser.subscription_status || "none"}
                        </Badge>
                      </div>

                      {assignedUser.subscription_expires_at && (
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {getDaysRemaining(assignedUser.subscription_expires_at)} days
                            remaining
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{assignedUser.email}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right: User Details & Chat Area */}
          <div className="md:col-span-2">
            {selectedUser ? (
              <div className="space-y-6">
                {/* User Info Card */}
                <Card className="bg-neutral-900/60 border-neutral-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold">{selectedUser.full_name}</h3>
                        <p className="text-neutral-400">@{selectedUser.username}</p>
                      </div>
                      <Badge
                        className={`${getSubscriptionColor(
                          selectedUser.subscription_status
                        )}`}
                      >
                        {selectedUser.subscription_status || "none"}
                      </Badge>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-neutral-400">Email</p>
                        <p className="font-medium">{selectedUser.email}</p>
                      </div>
                      {selectedUser.phone && (
                        <div>
                          <p className="text-neutral-400">Phone</p>
                          <p className="font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {selectedUser.phone}
                          </p>
                        </div>
                      )}
                      {selectedUser.subscription_expires_at && (
                        <div>
                          <p className="text-neutral-400">Subscription Expires</p>
                          <p className="font-medium">
                            {new Date(
                              selectedUser.subscription_expires_at
                            ).toLocaleDateString()}
                            ({getDaysRemaining(selectedUser.subscription_expires_at)} days)
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-neutral-400">Assigned Since</p>
                        <p className="font-medium">
                          {new Date(selectedUser.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="bg-neutral-900/60 border-neutral-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Conversation
                      </h4>
                    </div>

                    {selectedUser.subscription_status !== "active" ? (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-300">
                          This user's subscription is {selectedUser.subscription_status || "inactive"}. 
                          They will not be able to send messages until their subscription is renewed.
                        </p>
                      </div>
                    ) : (
                      <AgentChatInterface userId={selectedUserId!} />
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-neutral-900/60 border-neutral-800 h-96 flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">
                    Select a user to view details and start chatting
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentChatInterface({ userId }: { userId: string }) {
  const [messageInput, setMessageInput] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get the agent's own record using safe RPC function
  const { data: agentRecord, isLoading: agentLoading, error: agentError } = useQuery({
    queryKey: ["agentSelf", user?.id],
    queryFn: () => rpc.agent.getSelf(),
    enabled: !!user?.id,
  });

  // Get the conversation with this user
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["agentConversations", userId, agentRecord?.id],
    queryFn: async () => {
      if (!agentRecord?.id) return [];
      const data = await rpc.agent.getConversationWithUser(userId);
      return data || [];
    },
    enabled: !!agentRecord?.id,
  });

  const conversationId = conversations[0]?.id;

  // Realtime subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`public:messages:agent_conversation_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[Agent] Realtime event received:', payload);
          queryClient.invalidateQueries({ queryKey: ["agentMessages"] });
        }
      )
      .subscribe((status) => {
        console.log('[Agent] Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["agentMessages", conversationId],
    queryFn: () => rpc.conversation.getMessages(conversationId),
    enabled: !!conversationId,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => rpc.conversation.sendMessage(conversationId, content, "media"),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["agentMessages", conversationId] });
      toast.success("Message sent");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMutation.mutate(messageInput.trim());
  };

  // Show error if agent record lookup failed
  if (agentError) {
    return (
      <div className="h-96 bg-neutral-800/30 rounded-lg border border-neutral-800/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-400 text-sm">Error loading agent record</p>
          <p className="text-xs text-neutral-500 mt-2">{(agentError as any)?.message}</p>
        </div>
      </div>
    );
  }

  // Show loading if still fetching agent record
  if (agentLoading || convsLoading) {
    return (
      <div className="h-96 bg-neutral-800/30 rounded-lg border border-neutral-800/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-600 border-t-rose-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-neutral-400 text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="h-96 bg-neutral-800/30 rounded-lg border border-neutral-800/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <p className="text-neutral-400">
            No active conversation with this user
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Conversation will be created once they initiate contact
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
        {messagesLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-neutral-800/30 rounded animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageSquare className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">No messages yet</p>
              <p className="text-xs text-neutral-500">Start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map((msg: any, index: number) => (
            <div
              key={index}
              className={`flex gap-2 ${msg.sender_role === "agent" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender_role === "agent"
                    ? "bg-rose-500/20 text-rose-100 border border-rose-500/30"
                    : "bg-neutral-700/50 text-neutral-100 border border-neutral-600/50"
                }`}
              >
                {msg.type === "text" && <p className="text-sm">{msg.content}</p>}
                {msg.type === "media" && (
                  <div>
                    {msg.media_url && msg.media_url.startsWith("http") ? (
                      <img src={msg.media_url} alt="media" className="max-w-xs rounded mb-2" />
                    ) : null}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                  </div>
                )}
                {msg.type === "voice" && msg.media_url && (
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <audio controls src={msg.media_url} className="max-w-xs" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!messageInput.trim() || sendMutation.isPending}
          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
