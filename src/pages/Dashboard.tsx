import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { usePendingPayment } from "@/hooks/usePendingPayment";
import AppShell from "@/components/AppShell";
import AvatarRing from "@/components/AvatarRing";
import StatusPill from "@/components/StatusPill";
import ProfileTab from "@/components/ProfileTab";
import {
  MessageCircle, Ticket, LogOut, Bell,
  CheckCircle, Zap, Settings, ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";

  // Fetch credit balance with aggressive caching
  const { data: creditBalance, isLoading: creditLoading, isError: creditError } = useQuery({
    queryKey: ["user_credits", "balance", user?.id],
    queryFn: () => rpc.payment.getUserCreditsBalance(),
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 500,
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Keep subscription status for backward compatibility (aggressive caching)
  const { data: subscriptionStatus, isLoading: subscriptionLoading, isError: subscriptionError } = useQuery({
    queryKey: ["subscription", "userStatus", user?.id],
    queryFn: () => rpc.payment.getUserStatus(),
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 500,
    staleTime: 2 * 60 * 1000, // 2 minutes - aggressive caching
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch pending payment status (shared state with Subscribe page)
  const { data: hasPendingPayment } = usePendingPayment(user?.id);

  // Fetch unread notifications
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch tickets (uses same key as Tickets.tsx for instant cache sharing!)
  const { data: myTicketsData } = useQuery({
    queryKey: ['tickets', 'my'],
    queryFn: () => rpc.ticket.myTickets(),
    enabled: !!user?.id,
    staleTime: 10 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  // Fetch unread messages count
  const { data: unreadMessagesCount } = useQuery({
    queryKey: ["messages", "unreadCount", user?.id],
    queryFn: async () => {
      const { data: convos, error: convosError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user!.id);
      
      if (convosError) throw convosError;
      if (!convos || convos.length === 0) return 0;
      
      const convoIds = convos.map((c: any) => c.id);
      const { count, error: countError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .neq("sender_role", "user")
        .eq("is_read", false);
      
      if (countError) throw countError;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  const notifications = notificationsData || [];
  const myTickets = myTicketsData || [];
  const unreadMessages = unreadMessagesCount || 0;

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      console.log("🔄 Admin user detected, redirecting to admin dashboard");
      navigate("/admin", { replace: true });
    }
  }, [user?.role, navigate]);

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  if (!user) return null;

  const daysLeft = subscriptionStatus?.expiresAt ? getDaysRemaining(subscriptionStatus.expiresAt) : null;

  return (
    <AppShell
      title={
        activeTab === "profile" ? "My Profile" : 
        activeTab === "subscription" ? "Subscription" : 
        `Hi, ${user.full_name?.split(" ")[0] || "User"}`
      }
      showBackButton={activeTab !== "home"}
      onBackClick={() => navigate("/dashboard")}
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logout()}
          className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      }
    >
      <div className="px-4 py-6 space-y-6">
        {activeTab === "home" && (
          <>
            {/* Profile Hero Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AvatarRing name={user.full_name || user.email} size="lg" imageUrl={user.profile_photo} />
              <div>
                <h2 className="font-semibold text-lg">{user.full_name || user.email}</h2>
                <p className="text-neutral-400 text-sm">{user.email}</p>
              </div>
            </div>
            <Link to="/dashboard?tab=profile">
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Status line - Credit Balance */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-neutral-300">Active</span>
            </div>
            {creditBalance?.balance !== undefined && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-400" />
                <span className="text-sm text-neutral-300">{Math.floor(creditBalance.balance)} credits</span>
              </div>
            )}
          </div>
        </div>

        {/* Activity Strip - Horizontal scrollable pills */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 min-w-min pb-2">
            <button
              onClick={() => navigate("/messages")}
              className="flex items-center gap-2 min-w-max px-4 py-3 rounded-full bg-surface-2 border border-surface-3 hover:border-rose-500/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium">
                {unreadMessages > 0 ? `${unreadMessages} Unread` : "Messages"}
              </span>
            </button>

            {hasPendingPayment && (
              <button
                onClick={() => navigate("/dashboard?tab=subscription")}
                className="flex items-center gap-2 min-w-max px-4 py-3 rounded-full bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium">Pending</span>
              </button>
            )}

            <button
              onClick={() => navigate("/tickets")}
              className="flex items-center gap-2 min-w-max px-4 py-3 rounded-full bg-surface-2 border border-surface-3 hover:border-rose-500/50 transition-colors"
            >
              <Ticket className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">{myTickets.length}</span>
            </button>

            {creditBalance?.balance !== undefined && creditBalance.balance > 0 && (
              <div className="flex items-center gap-2 min-w-max px-4 py-3 rounded-full bg-rose-500/10 border border-rose-500/30">
                <Zap className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-medium">{Math.floor(creditBalance.balance)} Credits</span>
              </div>
            )}
          </div>
        </div>

        {/* === CREDIT BALANCE CARD === */}
        {creditBalance?.balance !== undefined && (
          <div className={`${
            creditBalance.balance > 5
              ? "bg-gradient-to-r from-rose-500/20 to-pink-600/20 border-rose-500/30"
              : "bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-amber-500/30"
          } rounded-2xl p-4 border`}>
            <div className="flex items-start gap-3">
              <Zap className={`w-5 h-5 flex-shrink-0 mt-0.5 ${creditBalance.balance > 5 ? "text-rose-400" : "text-amber-400"}`} />
              <div className="flex-1">
                <h3 className={`font-semibold ${creditBalance.balance > 5 ? "text-rose-300" : "text-amber-300"}`}>
                  {creditBalance.balance > 0 ? `${Math.floor(creditBalance.balance)} Credits Available` : "Out of Credits"}
                </h3>
                {creditBalance.balance > 0 && creditBalance.balance <= 5 && (
                  <p className="text-sm text-neutral-300 mt-1">
                    You have low credits. Add more to continue chatting.
                  </p>
                )}
                {creditBalance.balance === 0 && (
                  <p className="text-sm text-neutral-300 mt-1">
                    Add credits to start chatting with your favorites.
                  </p>
                )}
                <Link to="/deposit">
                  <Button
                    className={`mt-3 h-auto px-4 ${
                      creditBalance.balance > 5
                        ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                        : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    }`}
                  >
                    {creditBalance.balance > 0 ? "Add More Credits" : "Buy Credits Now"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payment Banner */}
        {hasPendingPayment && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-none">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-300">Deposit Request Pending</h3>
                <p className="text-sm text-neutral-300 mt-1">
                  Your deposit is under review. Admin will contact you soon with payment details.
                </p>
                <Button
                  onClick={() => navigate("/dashboard?tab=credits")}
                  variant="ghost"
                  className="mt-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 h-auto px-0 text-sm"
                >
                  View Status →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Section Navigation Cards */}
        <div className="space-y-3">
          <Link to="/messages">
            <button className="w-full bg-surface-1 border border-surface-3 rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-transform hover:border-surface-2">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-rose-400" />
                <div className="text-left">
                  <p className="font-semibold">Messages</p>
                  <p className="text-xs text-neutral-400">Tap to open your conversations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadMessages > 0 && (
                  <span className="text-sm font-semibold text-rose-400">{unreadMessages} new</span>
                )}
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>
            </button>
          </Link>

          <Link to="/deposit">
            <button className="w-full bg-surface-1 border border-surface-3 rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-transform hover:border-surface-2">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-rose-400" />
                <div className="text-left">
                  <p className="font-semibold">Credits</p>
                  <p className="text-xs text-neutral-400">
                    {creditBalance?.balance ? `${Math.floor(creditBalance.balance)} available` : "Buy credits to chat"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
          </Link>

          <Link to="/tickets">
            <button className="w-full bg-surface-1 border border-surface-3 rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-transform hover:border-surface-2">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p className="font-semibold">Support Tickets</p>
                  <p className="text-xs text-neutral-400">View your open tickets</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {myTickets.length > 0 && (
                  <span className="text-sm font-semibold text-blue-400">{myTickets.length}</span>
                )}
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>
            </button>
          </Link>

          <Link to="/notifications">
            <button className="w-full bg-surface-1 border border-surface-3 rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-transform hover:border-surface-2">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-rose-400" />
                <div className="text-left">
                  <p className="font-semibold">Notifications</p>
                  <p className="text-xs text-neutral-400">Latest updates</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <span className="text-sm font-semibold text-rose-400">{notifications.length}</span>
                )}
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>
            </button>
          </Link>
        </div>
        </>
        )}

        {/* Subscription Detail Section (if tab=subscription) */}
        {activeTab === "subscription" && (
          <div className="bg-surface-1 border border-surface-3 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Subscription Status
            </h3>

            {subscriptionStatus?.status === "active" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-neutral-400 text-xs mb-1">Current Status</p>
                    <StatusPill status={subscriptionStatus.status} text="Active" />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs mb-1">Expires</p>
                    <p className="text-sm font-semibold">
                      {subscriptionStatus.expiresAt
                        ? new Date(subscriptionStatus.expiresAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>

                {subscriptionStatus.agent_name && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-xs text-neutral-400 mb-1">Your Assigned Agent</p>
                    <p className="font-semibold text-emerald-300">{subscriptionStatus.agent_name}</p>
                    {subscriptionStatus.agent_email && (
                      <p className="text-xs text-neutral-400 mt-1">{subscriptionStatus.agent_email}</p>
                    )}
                  </div>
                )}
              </>
            ) : hasPendingPayment ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                  <div className="w-4 h-4 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <p className="font-semibold text-amber-300 mb-2">Request Under Review</p>
                <p className="text-sm text-neutral-400 mb-1">
                  Your subscription request has been submitted.
                </p>
                <p className="text-xs text-neutral-500">
                  Our team is reviewing your payment. You'll be notified once it's approved.
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="font-semibold mb-2">Unlock Full Access</p>
                <p className="text-sm text-neutral-400 mb-4">
                  Subscribe to start meaningful conversations
                </p>
                <Link to="/subscribe">
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                    Subscribe Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && <ProfileTab />}
      </div>
    </AppShell>
  );
}

