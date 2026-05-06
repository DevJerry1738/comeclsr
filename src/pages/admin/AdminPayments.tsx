import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, CheckCircle, XCircle } from "lucide-react";

export default function AdminPayments() {
  const { user, logout } = useAuth();
  const { data: payments, refetch } = trpc.payment.allPayments.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateStatus = trpc.payment.updateStatus.useMutation({ onSuccess: () => { toast.success("Payment updated"); refetch(); } });

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
          <h1 className="font-semibold">Payment Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6"><h2 className="text-xl font-bold">Payment Requests</h2><p className="text-sm text-neutral-500">{payments?.length || 0} total requests</p></div>

        <Card className="bg-neutral-900/60 border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-neutral-800 text-left">
                <th className="p-4 text-xs font-medium text-neutral-500 uppercase">ID</th>
                <th className="p-4 text-xs font-medium text-neutral-500 uppercase">User</th>
                <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Amount</th>
                <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Method</th>
                <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Date</th>
                <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {payments?.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-white/5">
                    <td className="p-4 text-sm">#{p.id}</td>
                    <td className="p-4 text-sm">{p.userId}</td>
                    <td className="p-4 text-sm font-medium">${p.amount}</td>
                    <td className="p-4 text-sm">{p.method}</td>
                    <td className="p-4"><Badge className={getStatusColor(p.status)}>{p.status}</Badge></td>
                    <td className="p-4 text-sm text-neutral-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {p.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" onClick={() => updateStatus.mutate({ id: p.id, status: "approved" })}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                            <Button size="sm" className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" onClick={() => updateStatus.mutate({ id: p.id, status: "rejected" })}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
