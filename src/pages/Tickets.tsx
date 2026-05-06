import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, Plus, Send, Ticket } from "lucide-react";

export default function Tickets() {
  const { user, logout } = useAuth();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [replyText, setReplyText] = useState("");
  const [activeTicket, setActiveTicket] = useState<number | null>(null);

  const { data: tickets, refetch } = trpc.ticket.myTickets.useQuery(undefined, { enabled: !!user });
  const createTicket = trpc.ticket.create.useMutation({ onSuccess: () => { toast.success("Ticket created!"); setSubject(""); refetch(); } });
  const replyTicket = trpc.ticket.reply.useMutation({ onSuccess: () => { setReplyText(""); refetch(); } });

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <h1 className="font-semibold">Support Tickets</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Create Ticket */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardHeader><CardTitle className="text-lg">New Ticket</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Subject</label>
                  <input className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's the issue?" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Category</label>
                  <select className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="general">General</option>
                    <option value="payment">Payment</option>
                    <option value="agent">Agent</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Button onClick={() => subject && createTicket.mutate({ subject, category: category as any })} className="w-full bg-gradient-to-r from-rose-500 to-pink-600"><Plus className="w-4 h-4 mr-2" />Create</Button>
              </CardContent>
            </Card>
          </div>

          {/* Ticket List */}
          <div className="md:col-span-2 space-y-4">
            {tickets?.map((t) => (
              <Card key={t.id} className={`bg-neutral-900/60 border-neutral-800 cursor-pointer transition-all ${activeTicket === t.id ? "ring-1 ring-rose-500/30" : ""}`} onClick={() => setActiveTicket(activeTicket === t.id ? null : t.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-4 h-4 text-rose-400" />
                      <span className="font-medium text-sm">{t.subject}</span>
                    </div>
                    <Badge className={getStatusColor(t.status)}>{t.status}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500">{t.category} — {new Date(t.createdAt).toLocaleDateString()}</p>

                  {activeTicket === t.id && (
                    <div className="mt-4 space-y-4 border-t border-neutral-800 pt-4">
                      {t.replies && t.replies.length > 0 && (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {t.replies.map((r, i) => (
                            <div key={i} className={`p-3 rounded-lg text-sm ${r.senderRole === "admin" ? "bg-rose-500/10 border border-rose-500/20" : "bg-neutral-800/50"}`}>
                              <p className="text-xs text-rose-400 mb-1">{r.senderRole}</p>
                              <p className="text-white">{r.message}</p>
                              <p className="text-[10px] text-neutral-500 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input className="flex-1 p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply..." onKeyDown={e => e.key === "Enter" && replyText && replyTicket.mutate({ ticketId: t.id, message: replyText })} />
                        <Button size="sm" onClick={() => replyText && replyTicket.mutate({ ticketId: t.id, message: replyText })} className="bg-gradient-to-r from-rose-500 to-pink-600"><Send className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!tickets || tickets.length === 0) && (
              <div className="text-center py-12 text-neutral-500">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                <p>No tickets yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
