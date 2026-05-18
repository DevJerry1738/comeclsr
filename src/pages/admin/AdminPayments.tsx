import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, CheckCircle } from "lucide-react";

interface PaymentRequest {
  request_id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  status: "pending" | "confirmed" | "rejected";
  requested_at: string;
}

interface Agent {
  id: string;
  email: string;
  full_name?: string;
}

type FilterStatus = "all" | "pending" | "confirmed" | "rejected";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected:  "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminPayments() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");

  // Fetch ALL payment requests (not just pending) so history is preserved after approval
  const { data: payments, isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ["payment", "all"],
    queryFn: async () => {
      // Query all payment_requests regardless of status
      const { data: paymentRequests, error: paymentsError } = await supabase
        .from("payment_requests")
        .select("id, user_id, plan_id, payment_method, amount, status, requested_at")
        .order("requested_at", { ascending: false });

      if (paymentsError) {
        console.error("Error fetching payment_requests:", paymentsError.message, paymentsError.details, paymentsError.code);
        throw paymentsError;
      }

      if (!paymentRequests || paymentRequests.length === 0) return [];

      const userIds = [...new Set((paymentRequests).map((p: any) => p.user_id))];
      const planIds = [...new Set((paymentRequests).map((p: any) => p.plan_id))];

      const { data: users } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, username")
        .in("id", userIds);

      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("id, name")
        .in("id", planIds);

      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));
      const plansMap = new Map((plans || []).map((p: any) => [p.id, p]));

      return (paymentRequests).map((item: any) => {
        const userData = usersMap.get(item.user_id);
        const planData = plansMap.get(item.plan_id);
        return {
          request_id: item.id,
          user_id: item.user_id,
          username: userData?.username || "",
          full_name: userData?.full_name || "",
          email: userData?.email || "",
          plan_id: item.plan_id,
          plan_name: planData?.name || "",
          amount: item.amount,
          payment_method: item.payment_method,
          status: item.status,
          requested_at: item.requested_at,
        };
      }) as PaymentRequest[];
    },
    enabled: user?.role === "admin",
  });

  // Fetch available agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents", "list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .eq("role", "agent");
      return data as Agent[];
    },
    enabled: user?.role === "admin",
  });

  // Derived: filtered list based on active tab
  const filteredPayments = (payments || []).filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  const counts = {
    all:       payments?.length ?? 0,
    pending:   payments?.filter((p) => p.status === "pending").length ?? 0,
    confirmed: payments?.filter((p) => p.status === "confirmed").length ?? 0,
    rejected:  payments?.filter((p) => p.status === "rejected").length ?? 0,
  };

  // Confirm and assign payment
  const confirmPayment = useMutation({
    mutationFn: async (variables: {
      paymentRequestId: string;
      agentId: string;
    }) => {
      const result = await rpc.payment.confirmAndAssign(
        variables.paymentRequestId,
        variables.agentId,
        "Payment confirmed by admin"
      );

      const { data: paymentRequest } = (await supabase
        .from("payment_requests")
        .select("*")
        .eq("id", variables.paymentRequestId)
        .single()) as any;

      if (!paymentRequest) throw new Error("Payment request not found");

      const { data: userData } = (await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", paymentRequest.user_id)
        .single()) as any;

      const { data: agentData } = (await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", variables.agentId)
        .single()) as any;

      const { data: plan } = (await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", paymentRequest.plan_id)
        .single()) as any;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (plan?.duration_days || 30));

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No active session");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Send confirmation emails (non-fatal)
      const emailPayloads = [
        {
          url: `${supabaseUrl}/functions/v1/send-payment-request`,
          body: { userName: userData?.full_name || "User", userEmail: userData?.email, amount: plan?.amount || 0, paymentMethod: paymentRequest.payment_method, requestId: variables.paymentRequestId },
        },
        {
          url: `${supabaseUrl}/functions/v1/send-payment-confirmed`,
          body: { userEmail: userData?.email, userName: userData?.full_name || "User", amount: plan?.amount || 0, agentName: agentData?.full_name || "Agent", agentEmail: agentData?.email, expiryDate: expiryDate.toLocaleDateString() },
        },
        {
          url: `${supabaseUrl}/functions/v1/send-agent-assignment`,
          body: { agentEmail: agentData?.email, agentName: agentData?.full_name || "Agent", userName: userData?.full_name || "User", userEmail: userData?.email, assignmentDate: new Date().toLocaleDateString(), agentDashboardUrl: `${window.location.origin}/agent/dashboard` },
        },
      ];

      for (const { url, body } of emailPayloads) {
        try {
          const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
          if (!res.ok) console.error(`Email to ${url} failed (${res.status}):`, await res.text());
        } catch (e) {
          console.error("Email send error:", e);
        }
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Payment confirmed! Emails sent to admin, user, and agent.");
      queryClient.invalidateQueries({ queryKey: ["payment", "all"] });
      setSelectedAgent("");
      setSelectedPaymentId(null);
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to confirm payment");
    },
  });

  const handleConfirmClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    if (!selectedPaymentId || !selectedAgent) {
      toast.error("Please select an agent");
      return;
    }
    confirmPayment.mutate({ paymentRequestId: selectedPaymentId, agentId: selectedAgent });
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold">Payment Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">Payment History</h2>
          <p className="text-sm text-neutral-500">
            {paymentsLoading ? "Loading..." : `${counts.all} total · ${counts.pending} pending`}
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "confirmed", "rejected"] as FilterStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === tab
                  ? "bg-white/10 border-white/30 text-white"
                  : "border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs opacity-70">{counts[tab]}</span>
            </button>
          ))}
        </div>

        {paymentsError && (
          <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6">
            <p className="text-red-400 text-sm">
              <strong>Error:</strong> {paymentsError instanceof Error ? paymentsError.message : String(paymentsError)}
            </p>
          </Card>
        )}

        {paymentsLoading ? (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">Loading payments...</p>
          </Card>
        ) : filteredPayments.length > 0 ? (
          <Card className="bg-neutral-900/60 border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800 text-left">
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">ID</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">User</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Plan</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Method</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Date</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p: PaymentRequest) => (
                    <tr key={p.request_id} className="border-b border-neutral-800/50 hover:bg-white/5">
                      <td className="p-4 text-sm text-neutral-500">#{p.request_id.slice(0, 8)}</td>
                      <td className="p-4 text-sm">
                        <p className="font-medium">{p.full_name || p.username}</p>
                        <p className="text-xs text-neutral-500">{p.email}</p>
                      </td>
                      <td className="p-4 text-sm">{p.plan_name || "—"}</td>
                      <td className="p-4 text-sm font-medium">${p.amount.toFixed(2)}</td>
                      <td className="p-4 text-sm capitalize">{p.payment_method.replace("_", " ")}</td>
                      <td className="p-4">
                        <Badge className={STATUS_COLORS[p.status] ?? "bg-neutral-500/20 text-neutral-400"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-neutral-500">
                        {new Date(p.requested_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                            onClick={() => handleConfirmClick(p.request_id)}
                            disabled={confirmPayment.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirm
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">
              {filter === "all" ? "No payment requests yet" : `No ${filter} payments`}
            </p>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="bg-neutral-900 border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirm Payment & Assign Agent</AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Select an agent to assign to this payment. The user will be notified and the agent will receive the assignment.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 block mb-2">Select Agent</label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {agentsLoading ? (
                      <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                    ) : agents && agents.length > 0 ? (
                      agents.map((agent: Agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name || agent.email}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No agents available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="border-neutral-700 text-neutral-300 hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSubmit}
                disabled={!selectedAgent || confirmPayment.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {confirmPayment.isPending ? "Confirming..." : "Confirm & Assign"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
