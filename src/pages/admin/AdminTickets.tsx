import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { ArrowLeft, Heart, LogOut, Send, Ticket, CheckCircle } from "lucide-react";

export default function AdminTickets() {
  const { user, logout } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [activeTicket, setActiveTicket] = useState<number | null>(null);
  const { data: tickets, refetch } = trpc.ticket.allTickets.useQuery(undefined, { enabled: user?.role === "admin" });
  const reply = trpc.ticket.reply.useMutation({ onSuccess: () => { setReplyText(""); refetch(); } });
  const updateStatus = trpc.ticket.updateStatus.useMutation({ onSuccess: () => { refetch(); } });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "open": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "in_progress": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "closed": return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
      default: return "bg-neutral-500/20 text-neutral-400";
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <h1 className="font-semibold">Ticket Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6"><h2 className="text-xl font-bold">All Tickets</h2><p className="text-sm text-neutral-500">{tickets?.length || 0} total</p></div>

        <div className="grid md:grid-cols-2 gap-4">
          {tickets?.map((t) => (
            <Card key={t.id} className={`bg-neutral-900/60 border-neutral-800 cursor-pointer transition-all ${activeTicket === t.id ? "ring-1 ring-rose-500/30" : ""}`} onClick={() => setActiveTicket(activeTicket === t.id ? null : t.id)}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-orange-400" />
                    <div><p className="font-medium text-sm">{t.subject}</p><p className="text-xs text-neutral-500">{t.category} — {new Date(t.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <Badge className={getStatusColor(t.status)}>{t.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">User:</span>
                  <span className="text-white">{t.user?.fullName || `User #${t.userId}`}</span>
                </div>
                {activeTicket === t.id && (
                  <div className="space-y-4 border-t border-neutral-800 pt-4">
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
                      <input className="flex-1 p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" placeholder="Reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === "Enter" && replyText && reply.mutate({ ticketId: t.id, message: replyText })} />
                      <Button size="sm" onClick={() => replyText && reply.mutate({ ticketId: t.id, message: replyText })} className="bg-gradient-to-r from-rose-500 to-pink-600"><Send className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-400" onClick={() => updateStatus.mutate({ id: t.id, status: "resolved" })}><CheckCircle className="w-3 h-3 mr-1" />Resolve</Button>
                      <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-400" onClick={() => updateStatus.mutate({ id: t.id, status: "closed" })}>Close</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
