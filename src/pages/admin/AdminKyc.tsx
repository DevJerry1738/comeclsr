import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { ArrowLeft, Heart, LogOut, CheckCircle, XCircle, Shield } from "lucide-react";

export default function AdminKyc() {
  const { user, logout } = useAuth();
  const { data: kycs = [] } = useQuery({
    queryKey: ['kyc', 'all'],
    queryFn: () => rpc.kyc.getAll() || Promise.resolve([]),
    enabled: user?.role === 'admin',
  });

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
          {kycs?.map((k: any) => (
            <Card key={k.id} className="bg-neutral-900/60 border-neutral-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="font-medium text-sm">{k.fullName || k.username}</p>
                      <p className="text-xs text-neutral-500">{new Date(k.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(k.status)}>{k.status}</Badge>
                </div>
                <div className="space-y-2 text-sm pt-2">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {k.email && <p className="text-neutral-400"><span className="text-neutral-500">Email:</span> <span className="text-neutral-300">{k.email}</span></p>}
                    {k.phone && <p className="text-neutral-400"><span className="text-neutral-500">Phone:</span> <span className="text-neutral-300">{k.phone}</span></p>}
                    {k.age && <p className="text-neutral-400"><span className="text-neutral-500">Age:</span> <span className="text-neutral-300">{k.age}</span></p>}
                    {k.gender && <p className="text-neutral-400"><span className="text-neutral-500">Gender:</span> <span className="text-neutral-300 capitalize">{k.gender}</span></p>}
                    {k.location && <p className="text-neutral-400"><span className="text-neutral-500">Location:</span> <span className="text-neutral-300">{k.location}</span></p>}
                  </div>
                  
                  {k.interests && (
                    <div>
                      <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Interests</p>
                      <p className="text-neutral-300">{k.interests}</p>
                    </div>
                  )}
                  
                  {k.bio && (
                    <div>
                      <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Bio</p>
                      <p className="text-neutral-300 italic">"{k.bio}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
