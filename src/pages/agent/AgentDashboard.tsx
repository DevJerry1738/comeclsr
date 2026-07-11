import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AvatarRing from "@/components/AvatarRing";
import ProfileMediaGallery from "@/components/ProfileMediaGallery";
import AgentProfile from "./AgentProfile";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Heart, LogOut, MessageSquare, Mail, Phone, Clock,
  AlertCircle, Send, Play, ArrowLeft, Users, ChevronRight,
  Circle, CheckCheck, Check, User, Sparkles, Trash2, Info, X
} from "lucide-react";

export default function AgentDashboard() {
  const { user, logout, isAgent } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewState, setViewState] = useState<"chat" | "profile">("chat");

  const { data: assignedUsers = [], isLoading } = useQuery({
    queryKey: ["agent", "assignedUsers"],
    queryFn: () => rpc.agent.getAssignedUsers(),
    enabled: isAgent,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const filteredUsers = assignedUsers.filter((u: any) => {
    const nameMatch = (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  // Fetch agent record so we can show the agent's profile photo in the header
  const { data: agentRecord } = useQuery({
    queryKey: ["agentSelf", user?.id],
    queryFn: () => rpc.agent.getSelf(),
    enabled: !!user?.id && isAgent,
    staleTime: 60 * 1000,
  });

  // Send online heartbeat for agent
  useEffect(() => {
    if (!isAgent) return;
    
    const sendHeartbeat = async () => {
      try {
        await rpc.agent.heartbeat();
      } catch (err) {
        console.error("Agent heartbeat failed:", err);
      }
    };

    sendHeartbeat(); // Run immediately on mount
    const interval = setInterval(sendHeartbeat, 30000); // Every 30s

    return () => clearInterval(interval);
  }, [isAgent]);

  if (!user || !isAgent) return null;

  const selectedUser = assignedUsers.find((u: any) => u.user_id === selectedUserId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "credits": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
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
    setViewState("chat");
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
            <AvatarRing name={user.full_name || user.email} imageUrl={agentRecord?.profile_photo || undefined} size="sm" />
            <div>
              <p className="text-sm font-medium leading-tight">{agentRecord?.full_name || user.full_name}</p>
              <p className="text-[10px] text-neutral-500">Agent</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewState(viewState === "profile" ? "chat" : "profile")}
            className={`rounded-full ${viewState === "profile" ? "text-rose-400 bg-rose-500/10" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
          >
            <User className="w-4 h-4" />
          </Button>
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
          ${showList && viewState === "chat" ? 'flex' : 'hidden'} md:flex
          flex-col w-full md:w-80 lg:w-96
          border-r border-white/5 bg-neutral-900/40
          overflow-hidden flex-none
        `}>
          <div className="px-4 py-3 border-b border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm">Your Users</h2>
                <p className="text-xs text-neutral-500">{assignedUsers.length} assigned</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs placeholder:text-neutral-500 text-white focus:outline-none focus:border-rose-500/50 transition-colors"
              />
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
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-neutral-600" />
                </div>
                <p className="text-neutral-400 font-medium">
                  {searchQuery ? "No matching users" : "No users assigned yet"}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {searchQuery ? "Try a different search term" : "Users will appear here once assigned"}
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {filteredUsers.map((u: any) => (
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
                      <AvatarRing name={u.full_name || u.email} imageUrl={u.profile_photo || undefined} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-medium text-sm truncate">{u.full_name}</p>
                        <Badge className={`text-[10px] px-2 py-0 h-4 flex-none ${getStatusColor(u.subscription_status === "active" ? "active" : (u.credit_balance > 0 ? "credits" : u.subscription_status))}`}>
                          {u.subscription_status === "active" ? "active" : (u.credit_balance > 0 ? `${Math.floor(u.credit_balance)} credits` : (u.subscription_status || "none"))}
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

        {/* RIGHT: Chat Area or Profile Area */}
        <main className={`
          ${(!showList || selectedUserId) || viewState === "profile" ? 'flex' : 'hidden'} md:flex
          flex-col flex-1 overflow-hidden
        `}>
          {viewState === "profile" ? (
            <AgentProfile />
          ) : selectedUser ? (
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
  const [showUserInfo, setShowUserInfo] = useState(false);
  const queryClient = useQueryClient();
  const { user: agentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agentRecord, isLoading: agentLoading, error: agentError } = useQuery({
    queryKey: ["agentSelf", agentUser?.id],
    queryFn: () => rpc.agent.getSelf(),
    enabled: !!agentUser?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  const { data: adminSettings } = useQuery({
    queryKey: ['admin_settings'],
    queryFn: () => rpc.settings.getAdminSettings(),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const [newNote, setNewNote] = useState('');
  const [notesModalOpen, setNotesModalOpen] = useState(false);

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['agentUserNotes', selectedUser.user_id],
    queryFn: () => rpc.agent.getUserNotes(selectedUser.user_id),
    enabled: !!selectedUser.user_id,
    staleTime: 10 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => rpc.agent.addUserNote(selectedUser.user_id, content),
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['agentUserNotes', selectedUser.user_id] });
      toast.success('Note saved');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save note'),
  });

  const messageCostRate = adminSettings?.message_cost_rate ?? 5.00;

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["agentConversations", selectedUser.user_id, agentRecord?.id],
    queryFn: async () => {
      if (!agentRecord?.id) return [];
      return (await rpc.agent.getConversationWithUser(selectedUser.user_id)) || [];
    },
    enabled: !!agentRecord?.id,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const conversationId = conversations[0]?.id;

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["agentMessages", conversationId],
    queryFn: () => rpc.conversation.getMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = [];
  if (messages) {
    let currentDate = "";
    messages.forEach((msg: any) => {
      const dateStr = new Date(msg.created_at).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groupedMessages.push({ date: dateStr, messages: [] });
      }
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    });
  }

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
        queryClient.invalidateQueries({ queryKey: ["agent", "assignedUsers"] });
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
      queryClient.invalidateQueries({ queryKey: ["agent", "assignedUsers"] });
      
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

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => rpc.conversation.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentMessages", conversationId] });
      if (conversationId) {
        supabase.channel(`conversation_${conversationId}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: { conversationId: conversationId }
        });
      }
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete message"),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversationId) return;
    sendMutation.mutate(messageInput.trim());
  };

  const hasCredits = (selectedUser.credit_balance ?? 0) >= messageCostRate;
  const hasActiveSubscription = selectedUser.subscription_status === "active";
  const isInactive = !hasActiveSubscription && !hasCredits;

  const currentStatus = selectedUser.subscription_status === "active" ? "active" : (selectedUser.credit_balance > 0 ? "credits" : selectedUser.subscription_status);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Chat Header */}
      <div className="flex-none px-4 py-3 border-b border-white/5 bg-neutral-900/30 flex items-center justify-between hidden md:flex">
        <div className="flex items-center gap-3">
          <AvatarRing name={selectedUser.full_name || selectedUser.email} imageUrl={selectedUser.profile_photo || undefined} size="md" />
          <div>
            <p className="font-semibold text-sm">{selectedUser.full_name}</p>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] px-2 py-0 h-4 ${getStatusColor(currentStatus)}`}>
                {currentStatus === "credits" ? `${Math.floor(selectedUser.credit_balance || 0)} credits` : (currentStatus || "none")}
              </Badge>
              {selectedUser.subscription_expires_at && (
                <span className="text-[10px] text-neutral-500">
                  {getDaysRemaining(selectedUser.subscription_expires_at)}d left
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs">
            {hasActiveSubscription ? (
              <span className="text-neutral-400">Subscription: <span className="font-semibold text-emerald-400">Active</span></span>
            ) : (
              <span className="text-neutral-400">User Credits: <span className="font-semibold text-emerald-400">{Number(selectedUser.credit_balance || 0).toFixed(2)}</span></span>
            )}
            <span className="text-neutral-400">Cost per msg: <span className="font-semibold text-rose-400">{messageCostRate.toFixed(2)}</span></span>
          </div>
          <button
            onClick={() => setShowUserInfo(p => !p)}
            className={`p-2 rounded-full transition-colors ${showUserInfo ? 'bg-rose-500/10 text-rose-400' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
            title="User profile"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Info Side Drawer */}
      {showUserInfo && (
        <div className="absolute inset-y-0 right-0 z-40 w-full md:w-80 border-l border-white/5 bg-neutral-900/95 backdrop-blur-xl flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-white">User Profile</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserInfo(false)}
              className="text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* Photo & Name */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-neutral-800 overflow-hidden border-2 border-neutral-700 ring-4 ring-rose-500/10">
                {selectedUser.profile_photo ? (
                  <img src={selectedUser.profile_photo} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-400 font-bold text-2xl">
                    {(selectedUser.full_name || selectedUser.email)?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-lg text-white">{selectedUser.full_name || selectedUser.email}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">{selectedUser.email}</p>
              </div>
              {/* Status badge */}
              <Badge className={`text-[10px] px-3 py-0.5 ${getStatusColor(currentStatus)}`}>
                {currentStatus === "credits" ? `${Math.floor(selectedUser.credit_balance || 0)} credits` : (currentStatus || "none")}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-4">

              {selectedUser.phone && (
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Phone</p>
                  <p className="text-sm text-neutral-200 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 flex-none" />{selectedUser.phone}
                  </p>
                </div>
              )}

              {selectedUser.assigned_at && (
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Assigned</p>
                  <p className="text-sm text-neutral-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-500 flex-none" />
                    {new Date(selectedUser.assigned_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {(selectedUser.gender || selectedUser.age || selectedUser.location) && (
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Demographics</p>
                  <p className="text-sm text-neutral-200">
                    {[
                      selectedUser.gender ? selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1) : null,
                      selectedUser.age ? `${selectedUser.age} yrs old` : null,
                      selectedUser.location
                    ].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              )}

              {selectedUser.bio && (
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Bio</p>
                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {selectedUser.bio}
                  </p>
                </div>
              )}

              {selectedUser.interests && (
                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-400" /> Interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.interests.split(",")
                      .map((val: string) => val.trim())
                      .filter((val: string) => val.length > 0)
                      .map((interest: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-neutral-800 border border-neutral-700/50 text-neutral-300 text-xs rounded-full">
                          {interest}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Agent Notes</p>
                    {/* <p className="text-sm text-neutral-300">Shared notes other agents can see</p> */}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">{notes.length ?? 0} entries</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setNotesModalOpen(true)}
                      className="rounded-full px-3 py-1 text-[11px]"
                    >
                      View all notes
                    </Button>
                  </div>
                </div>

                {notesLoading ? (
                  <div className="space-y-2">
                    {[...Array(1)].map((_, idx) => (
                      <div key={idx} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 animate-pulse" />
                    ))}
                  </div>
                ) : notes.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/80 p-4 text-sm text-neutral-500">
                    No shared notes yet. Add a note to keep other agents informed.
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/5 bg-neutral-950 p-4">
                    <div className="flex items-start gap-3">
                      <AvatarRing name={notes[0].author_display_name || 'Agent'} imageUrl={notes[0].author_profile_photo || undefined} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-sm text-white truncate">{notes[0].author_display_name || 'Agent'}</p>
                          <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                            {new Date(notes[0].created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap break-words">
                          {notes[0].content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
                  <DialogContent className="bg-neutral-950 border border-neutral-800 text-white max-w-3xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Shared agent notes</DialogTitle>
                      <DialogDescription className="text-neutral-400">
                        {notes.length} total note{notes.length === 1 ? '' : 's'} for this user.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-3 overflow-y-auto pr-2 max-h-[56vh]">
                      {notesLoading ? (
                        [...Array(3)].map((_, idx) => (
                          <div key={idx} className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 animate-pulse" />
                        ))
                      ) : notes.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/80 p-6 text-sm text-neutral-500">
                          No shared notes yet.
                        </div>
                      ) : (
                        notes.map((note: any) => (
                          <div key={note.note_id} className="rounded-3xl border border-white/5 bg-neutral-950 p-4">
                            <div className="flex items-start gap-3">
                              <AvatarRing name={note.author_display_name || 'Agent'} imageUrl={note.author_profile_photo || undefined} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-medium text-sm text-white truncate">{note.author_display_name || 'Agent'}</p>
                                  <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                                    {new Date(note.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap break-words">
                                  {note.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button variant="secondary" className="rounded-2xl">
                          Close
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newNote.trim()) return;
                    addNoteMutation.mutate(newNote.trim());
                  }}
                  className="space-y-3"
                >
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500">
                    Add shared note
                  </label>
                  <textarea
                    rows={4}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    maxLength={2000}
                    placeholder="Write a note for other agents..."
                    disabled={addNoteMutation.isPending}
                    className="w-full rounded-3xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500/50 disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] text-neutral-500">{newNote.length}/2000</p>
                    <Button
                      type="submit"
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                      className="rounded-2xl bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                    >
                      {addNoteMutation.isPending ? 'Saving...' : 'Save note'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Credits info */}
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">Credits</p>
                  <p className="text-sm font-semibold text-emerald-400">
                    {hasActiveSubscription ? "Subscription" : Number(selectedUser.credit_balance || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">Cost / msg</p>
                  <p className="text-sm font-semibold text-rose-400">{messageCostRate.toFixed(2)}</p>
                </div>
              </div>

              {/* Media Gallery */}
              {selectedUser.user_id && (
                <div className="pt-2">
                  <ProfileMediaGallery userId={selectedUser.user_id} editable={false} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inactive warning */}
      {isInactive ? (
        <div className="flex-none mx-4 mt-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <p className="text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-none" />
            User has no active subscription or credits. They cannot send or receive messages.
          </p>
        </div>
      ) : (!hasActiveSubscription && (selectedUser.credit_balance ?? 0) < messageCostRate) ? (
        <div className="flex-none mx-4 mt-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <p className="text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-none" />
            User has insufficient credits ({Number(selectedUser.credit_balance || 0).toFixed(2)} remaining). Cost per message is {messageCostRate.toFixed(2)} credits.
          </p>
        </div>
      ) : null}

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
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <div className="flex items-center justify-center my-4">
                <span className="text-[10px] font-medium text-neutral-500 bg-neutral-900/60 border border-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                  {group.date}
                </span>
              </div>
              {group.messages.map((msg: any, i: number) => {
                const isAgent = msg.sender_role === "agent";
                return (
                  <div key={i} className={`flex gap-2.5 ${isAgent ? "justify-end" : "justify-start"}`}>
                    {!isAgent && (
                      <div className="flex-none self-end">
                        <AvatarRing name={selectedUser.full_name} imageUrl={selectedUser.profile_photo || undefined} size="sm" />
                      </div>
                    )}
                    <div className={`max-w-[72%] md:max-w-sm ${isAgent ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`group relative px-4 py-2.5 rounded-2xl text-sm ${
                        isAgent
                          ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-sm"
                          : "bg-neutral-800/70 border border-white/5 text-neutral-100 rounded-bl-sm"
                      }`}>
                        {isAgent && !msg.is_deleted && (
                           <button
                             onClick={() => confirm("Delete this message?") && deleteMutation.mutate(msg.id)}
                             disabled={deleteMutation.isPending}
                             className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                             title="Delete message"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        )}
                        {msg.is_deleted ? (
                          <p className="italic text-white/70 text-xs">This message was deleted</p>
                        ) : msg.type === "voice" && msg.media_url ? (
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
                    {isAgent && (
                      <div className="flex-none self-end">
                        <AvatarRing name={agentRecord?.full_name || "Agent"} imageUrl={agentRecord?.profile_photo || undefined} size="sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
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
