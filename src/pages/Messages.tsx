import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Send, Image, Mic, Play, Heart, LogOut, MessageCircle, Clock } from "lucide-react";

export default function Messages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [mediaInput, setMediaInput] = useState("");
  const [voiceInput, setVoiceInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user?.role, navigate]);

  const queryClient = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ['conversations', 'my'],
    queryFn: () => rpc.conversation.myConversations(),
    enabled: !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => rpc.conversation.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const sendMessage = useMutation({
    mutationFn: (data: any) => rpc.conversation.sendMessage(data.conversationId, data.content, data.type, data.mediaUrl, data.duration),
    onSuccess: () => {
      setMediaInput("");
      setVoiceInput("");
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send");
    },
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      const active = conversations.find(c => c.status === "active");
      if (active) setSelectedConversation(active.id);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMedia = () => {
    if (!mediaInput.trim() || !selectedConversation) return;
    sendMessage.mutate({
      conversationId: selectedConversation,
      type: "media",
      content: mediaInput,
      mediaUrl: mediaInput,
      duration: undefined,
    });
  };

  const handleSendVoice = () => {
    if (!voiceInput.trim() || !selectedConversation) return;
    sendMessage.mutate({
      conversationId: selectedConversation,
      type: "media",
      content: "Voice note",
      mediaUrl: voiceInput,
      duration: 30,
    });
  };

  if (!user) return null;

  const activeConversation = conversations?.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold">Messages</h1>
            {activeConversation && (
              <p className="text-xs text-neutral-500">
                {activeConversation.status === "active" ? "Active" : activeConversation.status}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-72 border-r border-white/10 overflow-y-auto shrink-0 hidden md:block">
          <div className="p-4">
            <h2 className="text-sm font-medium text-neutral-500 mb-3">Conversations</h2>
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                  selectedConversation === conv.id ? "bg-rose-500/10 border border-rose-500/30" : "bg-neutral-800/30 border border-transparent hover:bg-neutral-800/50"
                }`}
              >
                <p className="text-sm font-medium">{conv.agent?.displayName || "Agent"}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {conv.status === "active" ? "Active conversation" : conv.status === "pending" ? "Pending approval" : "Stopped"}
                </p>
              </button>
            ))}
            {(!conversations || conversations.length === 0) && (
              <p className="text-sm text-neutral-500 text-center py-8">No conversations yet</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation && activeConversation?.status === "active" ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages?.slice().reverse().map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        msg.senderRole === "user"
                          ? "bg-rose-500/20 text-white rounded-br-sm"
                          : "bg-neutral-800 text-white rounded-bl-sm"
                      }`}
                    >
                      {msg.type === "voice" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-rose-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-neutral-400">Voice Note</p>
                            <p className="text-xs text-neutral-500">{msg.duration || 0}s</p>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                            <Play className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          {msg.mediaUrl && msg.mediaUrl.startsWith("http") ? (
                            <img src={msg.mediaUrl} alt="Media" className="max-w-full rounded-lg mb-2" />
                          ) : null}
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/10 p-4 space-y-3 shrink-0">
                {/* Media Input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={mediaInput}
                      onChange={(e) => setMediaInput(e.target.value)}
                      placeholder="Paste media URL or type a message..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder:text-neutral-500"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMedia()}
                    />
                  </div>
                  <Button onClick={handleSendMedia} disabled={sendMessage.isPending || !mediaInput.trim()} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Voice Input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mic className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                      placeholder="Paste voice note URL..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder:text-neutral-500"
                      onKeyDown={(e) => e.key === "Enter" && handleSendVoice()}
                    />
                  </div>
                  <Button
                    onClick={() => setIsRecording(!isRecording)}
                    variant={isRecording ? "default" : "outline"}
                    className={isRecording ? "bg-red-500/20 text-red-400 border-red-500/30" : "border-neutral-700 text-neutral-400"}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleSendVoice} disabled={sendMessage.isPending || !voiceInput.trim()} variant="outline" className="border-neutral-700 text-neutral-400">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-neutral-500 text-center">Only media uploads and voice notes are supported</p>
              </div>
            </>
          ) : selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <Card className="bg-neutral-900/60 border-neutral-800 max-w-md mx-4">
                <CardContent className="p-8 text-center space-y-4">
                  <Clock className="w-12 h-12 text-amber-400 mx-auto" />
                  <p className="text-lg font-medium">Conversation Pending</p>
                  <p className="text-sm text-neutral-400">This conversation is waiting for admin approval. You'll be notified once approved.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto" />
                <p className="text-neutral-500">Select a conversation or wait for admin assignment</p>
                <Button onClick={() => navigate("/dashboard")} variant="outline" className="border-neutral-700 text-neutral-400">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
