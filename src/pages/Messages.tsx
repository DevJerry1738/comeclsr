import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Send, Heart, MessageCircle, Clock, Check, CheckCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [showList, setShowList] = useState(!selectedConversation);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user?.role, navigate]);

  const queryClient = useQueryClient();

  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['conversations', 'my'],
    queryFn: async () => rpc.conversation.myConversations(),
    enabled: !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => rpc.conversation.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const sendMessage = useMutation({
    mutationFn: (data: any) => 
      rpc.conversation.sendMessage(data.conversationId, data.content, data.type, data.mediaUrl),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'my'] });
      
      // Broadcast to other clients (like the agent)
      if (selectedConversation) {
        supabase.channel(`conversation_${selectedConversation}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: { conversationId: selectedConversation }
        });
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to send"),
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

  const activeConversation = conversations?.find((c: any) => c.id === selectedConversation);

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
              {conversations?.map((conv: any) => (
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${selectedConversation === conv.id ? 'bg-rose-500/20' : 'bg-neutral-800'}`}>
                    <Heart className={`w-5 h-5 ${selectedConversation === conv.id ? "text-rose-400" : "text-neutral-500"}`} />
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
          <div className={`${showList ? 'hidden' : 'block'} md:block md:flex-1 flex flex-col min-w-0 overflow-hidden`}>
            {activeConversation?.status === "active" ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-3 mb-6">
                      <div className="flex justify-center sticky top-2 z-20 mb-4">
                        <div className="bg-neutral-800/80 backdrop-blur-md text-neutral-300 text-[11px] font-medium px-4 py-1.5 rounded-full shadow-sm border border-white/5 uppercase tracking-wider">
                          {group.date}
                        </div>
                      </div>
                      
                      {group.messages.map((msg, index) => {
                        const isUser = msg.sender_role === "user";
                        const isLastInSequence = 
                          index === group.messages.length - 1 || 
                          group.messages[index + 1].sender_role !== msg.sender_role;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm ${
                                isUser
                                  ? `bg-gradient-to-br from-rose-500/25 to-pink-600/15 text-white border border-rose-500/30 rounded-2xl ${isLastInSequence ? 'rounded-tr-sm' : ''}`
                                  : `bg-surface-2 text-neutral-100 border border-white/10 rounded-2xl ${isLastInSequence ? 'rounded-tl-sm' : ''}`
                              }`}
                            >
                              <div className="flex flex-col">
                                {msg.media_url && msg.media_url.startsWith("http") && (
                                  <img 
                                    src={msg.media_url} 
                                    alt="Media" 
                                    className="max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" 
                                  />
                                )}
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                                  {isLastInSequence && (
                                    <div className={`flex items-center gap-1 shrink-0 ${isUser ? "text-rose-300/80" : "text-neutral-500"}`}>
                                      <span className="text-[10px] uppercase tracking-wider">{formatTime(msg.created_at)}</span>
                                      {isUser && (
                                        msg.is_read ? (
                                          <CheckCheck className="w-3 h-3 text-blue-400" />
                                        ) : (
                                          <Check className="w-3 h-3" />
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input Area */}
                <div className="bg-neutral-900/80 backdrop-blur-xl px-4 py-3 shrink-0 flex items-end gap-2 z-10 border-t border-white/5">
                  <div className="flex-1 bg-neutral-950/50 border border-white/10 rounded-2xl flex items-center min-h-[44px] shadow-inner focus-within:border-rose-500/30 transition-colors">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-transparent text-white text-[15px] px-4 py-3 placeholder:text-neutral-500 focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sendMessage.isPending || !messageInput.trim()} 
                    className={`rounded-full w-12 h-12 p-0 shrink-0 transition-all shadow-md min-h-[44px] min-w-[44px] ${messageInput.trim() ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white" : "bg-neutral-800 text-neutral-500"}`}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
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
      </div>
    </AppShell>
  );
}
