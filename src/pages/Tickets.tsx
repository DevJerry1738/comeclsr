import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Plus, Send, Ticket, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import BottomSheet from "@/components/BottomSheet";

export default function Tickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState("");
  const [activeTicket, setActiveTicket] = useState<number | null>(null);
  const [showTicketList, setShowTicketList] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user?.role, navigate]);

  const queryClient = useQueryClient();

  const { data: tickets } = useQuery({
    queryKey: ['tickets', 'my'],
    queryFn: () => rpc.ticket.myTickets(),
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: (data: any) => rpc.ticket.create(data.subject, undefined, data.category),
    onSuccess: () => {
      toast.success("Ticket created!");
      setSubject("");
      queryClient.invalidateQueries({ queryKey: ['tickets', 'my'] });
    },
    onError: (err: any) => toast.error(err.message || "Create failed"),
  });

  const replyTicket = useMutation({
    mutationFn: (data: any) => rpc.ticket.reply(data.ticketId, data.replyText),
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ['tickets', 'my'] });
    },
    onError: (err: any) => toast.error(err.message || "Reply failed"),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "open": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "in_progress": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "closed": return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
      default: return "bg-neutral-500/20 text-neutral-400";
    }
  };

  if (!user) return null;

  const activeTicketData = tickets?.find((t: any) => t.id === activeTicket);

  return (
    <AppShell
      title="Support Tickets"
      showBackButton={true}
      onBackClick={() => {
        if (window.innerWidth >= 768) {
          navigate("/dashboard");
        } else {
          if (!showTicketList && activeTicket) {
            setShowTicketList(true);
          } else {
            navigate("/dashboard");
          }
        }
      }}
      rightAction={
        <Button 
          size="icon" 
          onClick={() => setShowNewTicket(true)}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
        >
          <Plus className="w-5 h-5" />
        </Button>
      }
    >
      <div className="flex flex-col md:flex-row h-full gap-4 overflow-hidden p-4 pb-20">
        {/* Ticket List */}
        <div className={`${showTicketList ? 'block' : 'hidden'} md:block md:w-80 md:border-r md:border-white/10 md:pr-4 overflow-y-auto flex-1 md:flex-0 space-y-3`}>
          {tickets && tickets.length > 0 ? (
            tickets.map((t: any) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTicket(t.id);
                  setShowTicketList(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeTicket === t.id
                    ? "bg-rose-500/10 border-rose-500/30"
                    : "bg-neutral-900/50 border-white/5 hover:bg-neutral-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{t.subject}</span>
                  <Badge className={`text-xs shrink-0 ${
                    t.status === "resolved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    t.status === "open" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                    t.status === "in_progress" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    "bg-neutral-500/20 text-neutral-400"
                  }`}>{t.status}</Badge>
                </div>
                <p className="text-xs text-neutral-400">{t.category} • {new Date(t.createdAt).toLocaleDateString()}</p>
              </button>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <Ticket className="w-8 h-8 mx-auto mb-3 text-neutral-600" />
              <p className="text-sm text-neutral-500">No tickets yet</p>
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        {(!showTicketList || window.matchMedia("(min-width: 768px)").matches) && activeTicket && activeTicketData && (
          <div className={`${showTicketList ? 'hidden' : 'block'} md:block md:flex-1 flex flex-col overflow-hidden`}>
            {/* Replies */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {activeTicketData.replies && activeTicketData.replies.length > 0 ? (
                activeTicketData.replies.map((r: any, i: number) => (
                  <div
                    key={i}
                    className={`flex ${r.senderRole === "admin" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-xl text-sm ${
                        r.senderRole === "admin"
                          ? "bg-rose-500/10 border border-rose-500/20 text-neutral-100"
                          : "bg-surface-2 border border-surface-3 text-neutral-100"
                      }`}
                    >
                      {r.senderRole === "admin" && (
                        <p className="text-xs text-rose-400 font-medium mb-1">Support</p>
                      )}
                      <p>{r.message}</p>
                      <p className="text-xs text-neutral-400 mt-1">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4">No replies yet</p>
              )}
            </div>

            {/* Reply Input */}
            <div className="flex gap-2 border-t border-white/5 pt-3">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 bg-surface-2 border border-surface-3 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500/50 min-h-[44px]"
                onKeyDown={(e) => e.key === "Enter" && replyText && replyTicket.mutate({ ticketId: activeTicket, replyText })}
              />
              <Button
                size="icon"
                onClick={() => replyText && replyTicket.mutate({ ticketId: activeTicket, replyText })}
                disabled={replyTicket.isPending || !replyText.trim()}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white min-h-[44px] min-w-[44px]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!activeTicket && (
          <div className="hidden md:flex flex-1 items-center justify-center text-center">
            <div>
              <Ticket className="w-16 h-16 mx-auto mb-4 text-neutral-700" />
              <p className="text-neutral-500">Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Bottom Sheet */}
      <BottomSheet open={showNewTicket} onClose={() => setShowNewTicket(false)} title="Create New Ticket">
        <div className="space-y-5 p-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-200 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Describe your issue briefly..."
              style={{ backgroundColor: '#1c1c1e', color: '#ffffff' }}
              className="w-full border border-neutral-700 rounded-xl px-4 py-3 text-sm placeholder-neutral-500 focus:outline-none focus:border-rose-500 min-h-[48px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-200 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ backgroundColor: '#1c1c1e', color: '#ffffff' }}
              className="w-full border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 min-h-[48px] cursor-pointer"
            >
              <option value="general" style={{ background: '#1c1c1e', color: '#fff' }}>General</option>
              <option value="payment" style={{ background: '#1c1c1e', color: '#fff' }}>Payment</option>
              <option value="agent" style={{ background: '#1c1c1e', color: '#fff' }}>Agent</option>
              <option value="technical" style={{ background: '#1c1c1e', color: '#fff' }}>Technical</option>
              <option value="other" style={{ background: '#1c1c1e', color: '#fff' }}>Other</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={() => {
              if (subject.trim()) {
                createTicket.mutate({ subject, category: category as any });
                setShowNewTicket(false);
                setSubject("");
                setCategory("general");
              }
            }}
            disabled={createTicket.isPending || !subject.trim()}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3 rounded-xl min-h-[50px] text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createTicket.isPending ? "Creating..." : "Create Ticket"}
          </Button>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
