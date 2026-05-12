import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, CheckCircle, XCircle, Shield } from "lucide-react";

export default function AdminKyc() {
  const { user, logout } = useAuth();
  const { data: kycs, refetch } = trpc.kyc.allKyc.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateStatus = trpc.kyc.updateStatus.useMutation({ onSuccess: () => { toast.success("KYC updated"); refetch(); } });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <h1 className="font-semibold">KYC Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6"><h2 className="text-xl font-bold">KYC Submissions</h2><p className="text-sm text-neutral-500">{kycs?.length || 0} total</p></div>

        <div className="grid md:grid-cols-2 gap-4">
          {kycs?.map((k) => (
            <Card key={k.id} className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <div><p className="font-medium text-sm">User #{k.userId}</p><p className="text-xs text-neutral-500">{new Date(k.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <Badge className={getStatusColor(k.status)}>{k.status}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {k.peopleType && <p className="text-neutral-400"><span className="text-neutral-500">People Type:</span> {k.peopleType}</p>}
                  {k.conversationType && <p className="text-neutral-400"><span className="text-neutral-500">Conversation:</span> {k.conversationType}</p>}
                  {k.personalityPrefs && <p className="text-neutral-400"><span className="text-neutral-500">Personality:</span> {k.personalityPrefs}</p>}
                  {k.expectations && <p className="text-neutral-400"><span className="text-neutral-500">Expectations:</span> {k.expectations}</p>}
                </div>
                {k.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" onClick={() => updateStatus.mutate({ id: k.id, status: "approved" })}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                    <Button size="sm" className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" onClick={() => updateStatus.mutate({ id: k.id, status: "rejected" })}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
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
