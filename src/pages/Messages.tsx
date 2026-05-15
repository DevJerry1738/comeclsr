import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Send, Heart, LogOut, MessageCircle, Clock, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Messages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
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
    queryFn: async () => {
      const result = await rpc.conversation.myConversations();
      return result;
    },
    enabled: !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => rpc.conversation.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const sendMessage = useMutation({
    mutationFn: (data: any) => rpc.conversation.sendMessage(data.conversationId, data.content, data.type, data.mediaUrl),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send");
    },
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      const active = conversations.find((c: any) => c.status === "active");
      if (active) setSelectedConversation(active.id);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`public:messages:conversation_${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[Messages] Realtime event received:', payload);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      )
      .subscribe((status) => {
        console.log('[Messages] Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, queryClient]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    const isUrl = messageInput.trim().startsWith("http");
    
    sendMessage.mutate({
      conversationId: selectedConversation,
      type: "media", // Database constraint requires "media"
      content: messageInput,
      mediaUrl: isUrl ? messageInput : null,
    });
  };

  if (!user) return null;

  const activeConversation = conversations?.find((c: any) => c.id === selectedConversation);

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = [];
  if (messages) {
    let currentDate = "";
    // messages are already sorted by created_at ascending from RPC
    messages.forEach((msg: any) => {
      const dateStr = new Date(msg.created_at).toLocaleDateString([], {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groupedMessages.push({ date: dateStr, messages: [] });
      }
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    });
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="bg-neutral-900/50 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5 lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 overflow-hidden shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-semibold text-[16px] leading-tight text-white">
              {activeConversation ? activeConversation.agent_name || "Agent" : "Messages"}
            </h1>
            {activeConversation && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activeConversation.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                <p className="text-[12px] text-neutral-400">
                  {activeConversation.status === "active" ? "Online" : "Pending assignment"}
                </p>
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-[30%] min-w-[300px] max-w-[400px] border-r border-white/10 overflow-y-auto shrink-0 hidden md:flex flex-col bg-neutral-950/30">
          <div className="p-4 border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search or start new chat" 
                  className="w-full bg-neutral-900/80 text-neutral-200 text-sm rounded-xl pl-4 pr-4 py-2.5 border border-white/5 focus:outline-none focus:border-rose-500/30 placeholder:text-neutral-500 transition-colors"
                  disabled
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations?.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left flex gap-3 items-center px-3 py-3 rounded-xl transition-all mb-1 ${
                  selectedConversation === conv.id 
                    ? "bg-rose-500/10 border border-rose-500/30 shadow-sm" 
                    : "hover:bg-neutral-800/50 border border-transparent"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative transition-colors ${selectedConversation === conv.id ? 'bg-rose-500/20' : 'bg-neutral-800'}`}>
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
                    {conv.status === "active" ? "Tap to view conversation" : "Waiting for assignment"}
                  </p>
                </div>
              </button>
            ))}
            {(!conversations || conversations.length === 0) && (
              <div className="text-center py-10 px-4">
                {conversationsLoading ? (
                  <p className="text-neutral-500 text-sm animate-pulse">Loading conversations...</p>
                ) : conversationsError ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-red-400">Error loading chats</p>
                    <p className="text-neutral-500">{(conversationsError as any)?.message}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-neutral-500 text-sm">No chats yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {selectedConversation && activeConversation?.status === "active" ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 z-10 custom-scrollbar relative">
                {groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-3 mb-6">
                    {/* Sticky Date Header */}
                    <div className="flex justify-center sticky top-2 z-20 mb-4">
                      <div className="bg-neutral-800/80 backdrop-blur-md text-neutral-300 text-[11px] font-medium px-4 py-1.5 rounded-full shadow-sm border border-white/5 uppercase tracking-wider">
                        {group.date}
                      </div>
                    </div>
                    
                    {/* Messages in this group */}
                    {group.messages.map((msg, index) => {
                      const isUser = msg.sender_role === "user";
                      const isFirstInSequence = index === 0 || group.messages[index - 1].sender_role !== msg.sender_role;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
                        >
                          <div
                            className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-2 text-[14.5px] leading-relaxed shadow-sm ${
                              isUser
                                ? `bg-rose-500/20 text-white border border-rose-500/30 rounded-2xl ${isFirstInSequence ? 'rounded-tr-sm' : ''}`
                                : `bg-neutral-800 text-neutral-100 border border-white/5 rounded-2xl ${isFirstInSequence ? 'rounded-tl-sm' : ''}`
                            }`}
                          >
                            {/* Message Content */}
                            <div className="flex flex-col relative z-10 pt-0.5">
                              {msg.media_url && msg.media_url.startsWith("http") ? (
                                <img src={msg.media_url} alt="Media" className="max-w-full rounded-lg mb-2 mt-0.5" />
                              ) : null}
                              <div className="flex items-end flex-wrap gap-3">
                                <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                                
                                {/* Time and Read Receipt */}
                                <div className={`flex items-center gap-1 ml-auto float-right translate-y-[2px] ${isUser ? "text-rose-300/80" : "text-neutral-500"}`}>
                                  <span className="text-[10px] uppercase tracking-wider">{formatTime(msg.created_at)}</span>
                                  {isUser && (
                                    msg.is_read ? (
                                      <CheckCheck className="w-[14px] h-[14px] text-blue-400" />
                                    ) : (
                                      <Check className="w-[14px] h-[14px]" />
                                    )
                                  )}
                                </div>
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
              <div className="bg-neutral-900/80 backdrop-blur-xl px-4 py-3 shrink-0 flex items-end gap-3 z-10 border-t border-white/5">
                <div className="flex-1 bg-neutral-950/50 border border-white/10 rounded-2xl flex items-center min-h-[44px] shadow-inner transition-colors focus-within:border-rose-500/30">
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
                  className={`rounded-full w-12 h-12 p-0 shrink-0 transition-all shadow-md ${messageInput.trim() ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white" : "bg-neutral-800 text-neutral-500"}`}
                >
                  <Send className="w-[20px] h-[20px] ml-1" />
                </Button>
              </div>
            </>
          ) : selectedConversation ? (
            <div className="flex-1 flex items-center justify-center p-4 z-10">
              <Card className="bg-neutral-900/60 border-white/5 shadow-xl max-w-md w-full backdrop-blur-xl">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-8 h-8 text-amber-500 opacity-90" />
                  </div>
                  <p className="text-xl font-medium text-white">Conversation Pending</p>
                  <p className="text-[14.5px] text-neutral-400 leading-relaxed">This conversation is waiting for an agent to be assigned. We'll notify you once they're ready.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-neutral-950/20 z-10">
              <div className="text-center space-y-5 p-8 max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500/10 to-pink-600/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-500/5">
                  <MessageCircle className="w-10 h-10 text-rose-400" />
                </div>
                <h2 className="text-2xl font-light text-white">Select a Chat</h2>
                <p className="text-[14.5px] text-neutral-400 leading-relaxed">Choose a conversation from the sidebar to start messaging. Your messages are private and end-to-end encrypted.</p>
                <div className="pt-6 md:hidden">
                  <Button onClick={() => navigate("/dashboard")} className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-8 rounded-full border border-white/5">
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
