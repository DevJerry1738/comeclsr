import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, Bell, Send, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminNotifications() {
  const { user, logout } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    
    // Fetch recent notifications sent
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("title, message, created_at")
        .eq("type", "system")
        .order("created_at", { ascending: false })
        .limit(20);
        
      // Remove duplicates since it's broadcasted to many users
      if (data) {
        const unique = data.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => (t.title === v.title && t.message === v.message)) === i);
        setHistory(unique);
      }
    };
    fetchHistory();
  }, [user?.id, user?.role]);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    try {
      setIsSending(true);

      const { data, error } = await (supabase as any).rpc('admin_broadcast_notification', {
        p_title: title.trim(),
        p_message: message.trim(),
        p_type: 'system'
      });

      if (error) throw error;

      const sentTo = (data as any)?.sentTo ?? 0;
      toast.success(`Broadcast sent to ${sentTo} users!`);
      setHistory(prev => [{ title, message, created_at: new Date().toISOString() }, ...prev]);
      setTitle("");
      setMessage("");
    } catch (error: any) {
      console.error("Broadcast error:", error);
      toast.error(error.message || "Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <h1 className="font-semibold">Broadcast Center</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Send Notification</h2>
          <p className="text-sm text-neutral-500">Push a message to all users instantly.</p>
        </div>

        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-400"><Bell className="w-5 h-5" /> New Broadcast</CardTitle>
            <CardDescription className="text-neutral-400">All registered users will receive this in their dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleBroadcast(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Title</label>
                  <Input 
                    placeholder="e.g. System Maintenance, New Feature..." 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Message</label>
                  <textarea 
                    placeholder="Enter your message here..." 
                    value={message} 
                    onChange={e => setMessage(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-3 min-h-[120px] focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit"
                    disabled={isSending || !title || !message}
                    className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                  >
                    {isSending ? "Sending..." : <><Send className="w-4 h-4 mr-2" /> Send Broadcast</>}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-neutral-400" /> Recent Broadcasts</h3>
          {history.length === 0 ? (
            <p className="text-neutral-500 text-sm">No broadcasts sent yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-neutral-200">{h.title}</h4>
                    <span className="text-xs text-neutral-500">{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-neutral-400">{h.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
