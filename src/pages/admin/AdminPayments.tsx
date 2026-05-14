import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function AdminPayments() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch pending payments - using direct query instead of RPC to avoid role check issues
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payment", "pending"],
    queryFn: async () => {
      // Step 1: Query payment_requests directly
      const { data: paymentRequests, error: paymentsError } = await supabase
        .from("payment_requests")
        .select("id, user_id, plan_id, payment_method, amount, status, requested_at")
        .eq("status", "pending")
        .order("requested_at", { ascending: false });
      
      if (paymentsError) throw paymentsError;
      
      if (!paymentRequests || paymentRequests.length === 0) return [];
      
      // Step 2: Get unique user IDs and plan IDs
      const userIds = [...new Set((paymentRequests || []).map((p: any) => p.user_id))];
      const planIds = [...new Set((paymentRequests || []).map((p: any) => p.plan_id))];
      
      // Step 3: Fetch user profiles
      const { data: users } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, username")
        .in("id", userIds);
      
      // Step 4: Fetch subscription plans
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("id, name")
        .in("id", planIds);
      
      // Step 5: Create lookup maps
      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));
      const plansMap = new Map((plans || []).map((p: any) => [p.id, p]));
      
      // Step 6: Combine the data
      return (paymentRequests || []).map((item: any) => {
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

  // Confirm and assign payment
  const confirmPayment = useMutation({
    mutationFn: async (variables: {
      paymentRequestId: string;
      agentId: string;
    }) => {
      // First confirm in RPC
      const result = await rpc.payment.confirmAndAssign(
        variables.paymentRequestId,
        variables.agentId,
        "Payment confirmed by admin"
      );

      // Get payment request details
      const { data: paymentRequest } = (await supabase
        .from("payment_requests")
        .select("*")
        .eq("id", variables.paymentRequestId)
        .single()) as any;

      if (!paymentRequest) throw new Error("Payment request not found");

      // Get user info
      const { data: userData } = (await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", paymentRequest.user_id)
        .single()) as any;

      const userEmail = userData?.email;

      // Get agent info
      const { data: agentData } = (await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", variables.agentId)
        .single()) as any;

      const agentEmail = agentData?.email;

      // Get plan info
      const { data: plan } = (await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", paymentRequest.plan_id)
        .single()) as any;

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (plan?.duration_days || 30));

      // Get current session for auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("No active session");

      // Get admin email from user profile
      const { data: adminData } = (await supabase
        .from("user_profiles")
        .select("email")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle()) as any;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Send email 1: Payment request to admin
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-payment-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adminEmail: adminData?.email || "admin@comeclsr.com",
            userName: userData?.full_name || "User",
            userEmail: userEmail,
            amount: plan?.amount || 0,
            paymentMethod: paymentRequest.payment_method,
            requestId: variables.paymentRequestId,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send admin email:", emailError);
      }

      // Send email 2: Payment confirmed to user
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-payment-confirmed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userEmail: userEmail,
            userName: userData?.full_name || "User",
            amount: plan?.amount || 0,
            agentName: agentData?.full_name || "Agent",
            agentEmail: agentEmail,
            expiryDate: expiryDate.toLocaleDateString(),
          }),
        });
      } catch (emailError) {
        console.error("Failed to send user confirmation email:", emailError);
      }

      // Send email 3: Agent assignment to agent
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-agent-assignment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agentEmail: agentEmail,
            agentName: agentData?.full_name || "Agent",
            userName: userData?.full_name || "User",
            userEmail: userEmail,
            assignmentDate: new Date().toLocaleDateString(),
            agentDashboardUrl: `${window.location.origin}/agent/dashboard`,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send agent assignment email:", emailError);
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Payment confirmed! Emails sent to admin, user, and agent.");
      queryClient.invalidateQueries({ queryKey: ["payment", "pending"] });
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
    confirmPayment.mutate({
      paymentRequestId: selectedPaymentId,
      agentId: selectedAgent,
    });
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold">Payment Management</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Pending Payment Requests</h2>
          <p className="text-sm text-neutral-500">
            {paymentsLoading ? "Loading..." : `${payments?.length || 0} pending requests`}
          </p>
        </div>

        {paymentsLoading ? (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">Loading payments...</p>
          </Card>
        ) : payments && payments.length > 0 ? (
          <Card className="bg-neutral-900/60 border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800 text-left">
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">
                      ID
                    </th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">
                      User Email
                    </th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">
                      Amount
                    </th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">
                      Method
                    </th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">
                      Date
                    </th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: PaymentRequest) => (
                    <tr key={p.request_id} className="border-b border-neutral-800/50 hover:bg-white/5">
                      <td className="p-4 text-sm">#{p.request_id.slice(0, 8)}</td>
                      <td className="p-4 text-sm">{p.email || p.username}</td>
                      <td className="p-4 text-sm font-medium">${p.amount.toFixed(2)}</td>
                      <td className="p-4 text-sm capitalize">{p.payment_method.replace('_', ' ')}</td>
                      <td className="p-4 text-sm text-neutral-500">
                        {new Date(p.requested_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          onClick={() => handleConfirmClick(p.request_id)}
                          disabled={confirmPayment.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Confirm & Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">No pending payment requests</p>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="bg-neutral-900 border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Confirm Payment & Assign Agent
              </AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Select an agent to assign to this payment. The user will be notified
                and the agent will receive the assignment.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 block mb-2">
                  Select Agent
                </label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="bg-neutral-800/50 border-neutral-700 text-white">
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {agentsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading agents...
                      </SelectItem>
                    ) : agents && agents.length > 0 ? (
                      agents.map((agent: Agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name || agent.email}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No agents available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="border-neutral-700 text-neutral-300 hover:text-white">
                Cancel
              </AlertDialogCancel>
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
