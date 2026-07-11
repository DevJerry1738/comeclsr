import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Send, Heart, MessageCircle, Clock, Check, CheckCheck, ArrowLeft, Trash2, Info, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatAgentDistanceLabel } from "@/lib/agentDistance";
import AppShell from "@/components/AppShell";
import AvatarRing from "@/components/AvatarRing";
import ProfileMediaGallery from "@/components/ProfileMediaGallery";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [showList, setShowList] = useState(!selectedConversation);
  const [messageInput, setMessageInput] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [showAgentBio, setShowAgentBio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Fetch conversations query
  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['conversations', 'my'],
    queryFn: async () => rpc.conversation.myConversations(),
    enabled: !!user,
    staleTime: 10 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  const activeConversation = conversations?.find((c: any) => c.id === selectedConversation);
  const agentDistanceLabel = formatAgentDistanceLabel(
    activeConversation?.agent_name,
    activeConversation?.agent_location_time_difference_hours,
  );

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => rpc.conversation.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user?.role, navigate]);



  // Fetch user's credit balance with caching
  const { data: creditBalance } = useQuery({
    queryKey: ['user_credits', 'balance', user?.id],
    queryFn: () => rpc.payment.getUserCreditsBalance(),
    enabled: !!user,
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch admin settings for message cost rate (cached - admin rarely changes this)
  const { data: adminSettings } = useQuery({
    queryKey: ['admin_settings'],
    queryFn: () => rpc.settings.getAdminSettings(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const messageCostRate = adminSettings?.message_cost_rate ?? 5.00;
  const userBalance = creditBalance?.balance ?? 0;



  const creditQueryKey = ['user_credits', 'balance', user?.id];

  const sendMessage = useMutation({
    mutationFn: (data: any) =>
      rpc.conversation.sendMessage(data.conversationId, data.content, data.type, data.mediaUrl),

    // ── Optimistic update: deduct cost immediately ──────────────────────────
    onMutate: async () => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic value
      await queryClient.cancelQueries({ queryKey: creditQueryKey });

      // Snapshot the current balance so we can roll back on error
      const previousCredit = queryClient.getQueryData(creditQueryKey);

      // Immediately deduct the cost from the local cache
      queryClient.setQueryData(creditQueryKey, (old: any) => {
        const current = old?.balance ?? 0;
        return { ...old, balance: Math.max(0, current - messageCostRate) };
      });

      return { previousCredit };
    },

    // ── Roll back if the request fails ────────────────────────────────────
    onError: (err: any, _vars, context: any) => {
      if (context?.previousCredit !== undefined) {
        queryClient.setQueryData(creditQueryKey, context.previousCredit);
      }
      toast.error(err.message || "Failed to send");
    },

    // ── Confirm with real server value after success ───────────────────────
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'my'] });
      // Refetch the real balance from the server to stay in sync
      queryClient.invalidateQueries({ queryKey: creditQueryKey });

      // Broadcast to other clients (like the agent)
      if (selectedConversation) {
        supabase.channel(`conversation_${selectedConversation}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: { conversationId: selectedConversation },
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => rpc.conversation.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversation] });
      if (selectedConversation) {
        supabase.channel(`conversation_${selectedConversation}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: { conversationId: selectedConversation }
        });
      }
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete message"),
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      const active = conversations.find((c: any) => c.status === "active");
      if (active) {
        setSelectedConversation(active.id);
        setShowList(false);
      }
    }
  }, [conversations, selectedConversation]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Realtime subscription (Broadcast for instant sync)
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`conversation_${selectedConversation}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('[Messages] Broadcast received:', payload);
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
        queryClient.invalidateQueries({ queryKey: ['conversations', 'my'] });
      })
      .subscribe((status) => {
        console.log('[Messages] Realtime status:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [selectedConversation, queryClient]);



  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    // Check if user has sufficient credits
    if (userBalance < messageCostRate) {
      toast.error(`Insufficient credits. You need ${messageCostRate.toFixed(2)} credits but only have ${userBalance.toFixed(2)}`);
      navigate("/deposit");
      return;
    }

    // Always send directly — agent will reply when online
    const isUrl = messageInput.trim().startsWith("http");
    sendMessage.mutate({
      conversationId: selectedConversation,
      type: "media",
      content: messageInput,
      mediaUrl: isUrl ? messageInput : null,
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) return null;



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

  return (
    <AppShell
      title={!showList && activeConversation ? activeConversation.agent_name : "Messages"}
      showBackButton={true}
      overflowHidden={true}
      onBackClick={() => {
        if (window.innerWidth >= 768) {
          navigate("/dashboard");
        } else {
          if (!showList && selectedConversation) {
            setShowList(true);
          } else {
            navigate("/dashboard");
          }
        }
      }}
      rightAction={
        !showList && activeConversation ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAgentBio(!showAgentBio)}
            className={`rounded-full ${showAgentBio ? "text-rose-400 bg-rose-500/10" : "text-neutral-400 hover:text-white"}`}
            title="View Agent Profile"
          >
            <Info className="w-5 h-5" />
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* Conversation List */}
        <div className={`${showList ? 'block' : 'hidden'} md:block md:border-r md:border-white/10 md:w-80 md:flex-shrink-0 md:bg-neutral-900/30 overflow-y-auto flex-col`}>
            <div className="p-4 border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl">
              <input 
                type="text" 
                placeholder="Search conversations" 
                className="w-full bg-neutral-900/80 text-neutral-200 text-sm rounded-xl pl-4 pr-4 py-2.5 border border-white/5 focus:outline-none focus:border-rose-500/30 placeholder:text-neutral-500 transition-colors"
                disabled
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {conversations?.filter((c: any) => c.status === "active").map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    setShowList(false);
                  }}
                  className={`w-full text-left flex gap-3 items-center px-3 py-3 rounded-xl transition-all mb-1 ${
                    selectedConversation === conv.id 
                      ? "bg-rose-500/10 border border-rose-500/30 shadow-sm" 
                      : "hover:bg-neutral-800/50 border border-transparent"
                  }`}
                >
                  <div className="shrink-0">
                    <AvatarRing
                      name={conv.agent_name || "Agent"}
                      imageUrl={conv.agent_profile_photo || undefined}
                      size="md"
                      online={conv.agent_is_online}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-[15px] font-medium text-white truncate">{conv.agent_name || "Agent"}</p>
                      {conv.last_message_at && (
                        <p className={`text-[11px] shrink-0 ml-2 ${selectedConversation === conv.id ? "text-rose-300" : "text-neutral-500"}`}>
                          {formatTime(conv.last_message_at)}
                        </p>
                      )}
                    </div>
                    <p className={`text-[13px] truncate ${selectedConversation === conv.id ? "text-rose-200/70" : "text-neutral-400"}`}>
                      {conv.status === "active" ? "Tap to view" : "Waiting..."}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                  )}
                </button>
              ))}
              {(!conversations || conversations.length === 0) && (
                <div className="text-center py-10 px-4">
                  {conversationsLoading ? (
                    <p className="text-neutral-500 text-sm animate-pulse">Loading...</p>
                  ) : conversationsError ? (
                    <p className="text-red-400 text-sm">Error loading chats</p>
                  ) : (
                    <p className="text-neutral-500 text-sm">No chats yet</p>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* Chat Area */}
        {selectedConversation && (
          <div className={`${showList ? 'hidden' : 'flex'} md:flex md:flex-1 flex-col min-w-0 overflow-hidden h-full`}>
            {activeConversation?.status === "active" ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-1">
                  {groupedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-10">
                      <div className="w-20 h-20 bg-gradient-to-br from-rose-500/10 to-pink-600/10 border border-rose-500/20 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/5">
                        <Heart className="w-10 h-10 text-rose-400" />
                      </div>
                      <h2 className="text-xl font-light text-white">Start the Connection</h2>
                      <p className="text-[14px] text-neutral-400 text-center max-w-xs mb-4">
                        Send a message to let them know you're interested.
                      </p>
                      <button
                        onClick={() => {
                          if (userBalance < messageCostRate) {
                            toast.error(`Insufficient credits. You need ${messageCostRate.toFixed(2)} credits but only have ${userBalance.toFixed(2)}`);
                            navigate("/deposit");
                            return;
                          }
                          sendMessage.mutate({
                            conversationId: selectedConversation,
                            type: "media",
                            content: "Hi 👋",
                            mediaUrl: null,
                          });
                        }}
                        disabled={sendMessage.isPending || userBalance < messageCostRate}
                        className="bg-gradient-to-br from-rose-500 to-pink-600 text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        Say hi 👋
                      </button>
                    </div>
                  ) : (
                    groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-1 mb-4">
                      <div className="flex justify-center sticky top-2 z-20 my-3">
                        <div className="bg-neutral-800/80 backdrop-blur-md text-neutral-400 text-[10px] font-semibold px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">
                          {group.date}
                        </div>
                      </div>
                      
                      {group.messages.map((msg, index) => {
                        const isUser = msg.sender_role === "user";
                        const isLastInSequence = 
                          index === group.messages.length - 1 || 
                          group.messages[index + 1].sender_role !== msg.sender_role;
                        const isFirstInSequence =
                          index === 0 ||
                          group.messages[index - 1].sender_role !== msg.sender_role;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isUser ? "justify-end" : "justify-start"} ${isFirstInSequence ? 'mt-2' : 'mt-0.5'}`}
                          >
                            <div
                              className={`group relative max-w-[80%] sm:max-w-[65%] px-4 py-2.5 text-[14.5px] leading-relaxed ${
                                isUser
                                  ? `bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20
                                     ${isLastInSequence ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
                                  : `bg-neutral-800 text-neutral-100 border border-white/5 shadow-sm
                                     ${isLastInSequence ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
                              }`}
                            >
                              {isUser && !msg.is_deleted && (
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
                              ) : msg.media_url && msg.media_url.startsWith("http") ? (
                                <img 
                                  src={msg.media_url} 
                                  alt="Media" 
                                  className="max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" 
                                />
                              ) : null}
                              {!msg.is_deleted && <span className="whitespace-pre-wrap break-words">{msg.content}</span>}
                              {isLastInSequence && (
                                <div className={`flex items-center justify-end gap-1 mt-1 ${isUser ? "text-white/60" : "text-neutral-500"}`}>
                                  <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                                  {isUser && (
                                    msg.is_read ? (
                                      <CheckCheck className="w-3 h-3 text-white/80" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )))}
                  <div ref={messagesEndRef} className="h-1" />
                </div>

                {/* Input Area */}
                <div className="flex-none bg-neutral-950/90 backdrop-blur-xl border-t border-white/5 px-4 py-3 space-y-2">
                  {/* Banners */}
                  {userBalance < messageCostRate && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-300 flex items-center justify-between">
                      <span>Insufficient credits to send</span>
                      <button onClick={() => navigate("/deposit")} className="underline hover:text-red-200 font-medium">Top up →</button>
                    </div>
                  )}
                  {userBalance > 0 && userBalance < 10 && userBalance >= messageCostRate && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-300">
                      ⚠ Low credits — consider topping up soon
                    </div>
                  )}

                  {/* Cost strip */}
                  <div className="flex items-center justify-between text-[11px] px-1">
                    {/* <span className="text-neutral-500">Cost per msg: <span className="text-rose-400 font-semibold">${messageCostRate.toFixed(2)}</span></span> */}
                    <span className={`font-semibold tabular-nums ${userBalance >= messageCostRate ? "text-emerald-400" : "text-red-400"}`}>
                      {userBalance.toFixed(2)} credits
                    </span>
                  </div>

                  {/* Input row */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-neutral-800/70 border border-white/8 rounded-3xl px-4 focus-within:border-rose-500/40 focus-within:bg-neutral-800 transition-all shadow-inner">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message…"
                        disabled={userBalance < messageCostRate}
                        className="flex-1 bg-transparent text-white text-[15px] py-3 placeholder:text-neutral-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && userBalance >= messageCostRate && handleSendMessage()}
                      />
                    </div>
                    <button 
                      onClick={() => handleSendMessage()} 
                      disabled={sendMessage.isPending || isReassigning || !messageInput.trim() || userBalance < messageCostRate} 
                      className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center transition-all ${
                        messageInput.trim() && userBalance >= messageCostRate
                          ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95"
                          : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-3 max-w-sm">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-lg font-medium text-white">Conversation Pending</p>
                  <p className="text-[14px] text-neutral-400">Waiting for agent assignment</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Conversation Selected */}
        {!selectedConversation && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-3 max-w-sm">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500/10 to-pink-600/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-rose-500/5">
                <MessageCircle className="w-10 h-10 text-rose-400" />
              </div>
              <h2 className="text-xl font-light text-white">Select a Chat</h2>
              <p className="text-[14px] text-neutral-400">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
        {/* Agent Bio Sidebar */}
        {showAgentBio && activeConversation && !showList && (
          <div className="w-full md:w-80 border-l border-white/5 bg-neutral-900/60 backdrop-blur-xl flex flex-col h-full flex-shrink-0 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white">Profile Details</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAgentBio(false)}
                className="text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Photo & Name */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-24 h-24 rounded-full bg-neutral-800 overflow-hidden border-2 border-neutral-700 ring-4 ring-rose-500/10">
                  {activeConversation.agent_profile_photo ? (
                    <img src={activeConversation.agent_profile_photo} alt={activeConversation.agent_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-400 font-bold text-2xl">
                      {activeConversation.agent_name?.[0] || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-white">{activeConversation.agent_name}</h4>
                  <p className="text-xs text-neutral-500 flex items-center justify-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${activeConversation.agent_is_online ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`} />
                    {activeConversation.agent_is_online ? "Online" : "Offline"}
                  </p>
                  {agentDistanceLabel && (
                    <p className="mt-2 text-sm text-emerald-300">{agentDistanceLabel}</p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4 pt-2">
                {activeConversation.agent_age && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Age</p>
                    <p className="text-sm text-neutral-200">{activeConversation.agent_age} years old</p>
                  </div>
                )}

                {activeConversation.agent_location && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Location / Nationality</p>
                    <p className="text-sm text-neutral-200">{activeConversation.agent_location}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Bio</p>
                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {activeConversation.agent_bio || <span className="text-neutral-600 italic">No bio written yet.</span>}
                  </p>
                </div>

                {activeConversation.agent_interests && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeConversation.agent_interests.split(",").map((tag: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-neutral-800 border border-neutral-700/50 text-neutral-300 text-xs rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeConversation.agent_user_id && (
                  <div className="pt-2">
                    <ProfileMediaGallery userId={activeConversation.agent_user_id} editable={false} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


    </AppShell>
  );
}
