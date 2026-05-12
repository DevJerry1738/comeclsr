import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import {
  CreditCard, Shield, MessageCircle, Ticket, LogOut, Bell,
  CheckCircle, Clock, XCircle, AlertCircle, Zap, User
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [myKyc, setMyKyc] = useState<any>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch subscription status
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", "userStatus", user?.id],
    queryFn: () => rpc.payment.getUserStatus(),
    enabled: !!user?.id,
  });

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      console.log("🔄 Admin user detected, redirecting to admin dashboard");
      navigate("/admin", { replace: true });
    }
  }, [user?.role, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data: notif } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .limit(5);
        setNotifications(notif || []);

        const { data: payments } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id);
        setMyPayments(payments || []);

        const { data: kyc } = await supabase
          .from("kyc_submissions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setMyKyc(kyc);

        const { data: tickets } = await supabase
          .from("tickets")
          .select("*")
          .eq("user_id", user.id);
        setMyTickets(tickets || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
      case "assigned":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "rejected":
      case "stopped":
      case "blocked":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "submitted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  if (!user) return null;
  if (loading && subscriptionLoading)
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Subscription Prompt Banner */}
        {subscriptionStatus?.status !== "active" && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border-2 border-amber-500/50 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Zap className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-amber-300">Unlock Full Access</h3>
                  <p className="text-neutral-300 text-sm mt-1">
                    Subscribe to connect with curated profiles, start conversations, and gain full access to the platform.
                  </p>
                </div>
              </div>
              <Link to="/subscribe" className="flex-shrink-0">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 whitespace-nowrap">
                  Subscribe Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              Welcome, {user.full_name || user.email}!
            </h1>
            <p className="text-neutral-400 mt-2">
              Manage your account and connect with others
            </p>
          </div>
          <Button onClick={() => logout()} variant="outline" size="lg">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Notifications</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Payments</p>
                  <p className="text-2xl font-bold">{myPayments.length}</p>
                </div>
                <CreditCard className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Support Tickets</p>
                  <p className="text-2xl font-bold">{myTickets.length}</p>
                </div>
                <Ticket className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">KYC Status</p>
                  <p className="text-2xl font-bold">
                    {myKyc?.status || "Pending"}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Subscription</p>
                  <p className="text-2xl font-bold">
                    {subscriptionStatus?.status ? "✓" : "—"}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-neutral-900 border-neutral-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="tickets">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-neutral-400 text-sm">Email</p>
                  <p className="text-lg font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Account Status</p>
                  <Badge className={getStatusColor(user.status || "active")}>
                    {getStatusIcon(user.status || "active")}
                    {user.status || "Active"}
                  </Badge>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">KYC Verification</p>
                  <Badge
                    className={getStatusColor(myKyc?.status || "pending")}
                  >
                    {myKyc?.status || "Not Started"}
                  </Badge>
                </div>

                {/* Requirements Info Box */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 mb-2">
                    <strong>💡 To start chatting:</strong>
                  </p>
                  <ul className="text-xs text-neutral-300 space-y-1">
                    <li>✓ Complete your profile</li>
                    <li>{subscriptionStatus?.status === "active" ? "✓ Active subscription" : "⚠ Active subscription required"}</li>
                    <li>{myKyc?.status === "approved" ? "✓ KYC verified" : "⚠ KYC verification pending"}</li>
                  </ul>
                </div>
                <div className="pt-4 space-y-3">
                  {subscriptionStatus?.status === "active" ? (
                    <Link to="/messages">
                      <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                        <MessageCircle className="w-4 h-4 mr-2" /> Start Conversation
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button 
                        disabled 
                        className="w-full opacity-50 cursor-not-allowed"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" /> Start Conversation
                      </Button>
                      <Link to="/subscribe" className="block">
                        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                          <Zap className="w-4 h-4 mr-2" /> Subscribe to Chat
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscriptionStatus && subscriptionStatus.status ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-neutral-400 text-sm mb-1">Current Status</p>
                        <Badge className={getStatusColor(subscriptionStatus.status)}>
                          {getStatusIcon(subscriptionStatus.status)}
                          {subscriptionStatus.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-neutral-400 text-sm mb-1">Expiry Date</p>
                        <p className="text-lg font-semibold">
                          {subscriptionStatus.expires_at
                            ? new Date(subscriptionStatus.expires_at).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {subscriptionStatus.expires_at && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-300">
                          📅 {getDaysRemaining(subscriptionStatus.expires_at)} days remaining in your subscription
                        </p>
                      </div>
                    )}

                    {subscriptionStatus.agent_name && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-sm text-neutral-400">Your Assigned Agent</p>
                            <p className="text-emerald-300 font-medium">{subscriptionStatus.agent_name}</p>
                            {subscriptionStatus.agent_email && (
                              <p className="text-xs text-neutral-400">{subscriptionStatus.agent_email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 rounded-lg text-center">
                      <Zap className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                      <p className="text-lg font-semibold text-neutral-200 mb-2">Unlock Full Access</p>
                      <p className="text-neutral-400 text-sm mb-4">
                        Subscribe to start meaningful conversations with curated profiles and gain full platform access.
                      </p>
                      <Link to="/subscribe">
                        <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                          Subscribe Now
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-semibold text-emerald-400 mb-1">🎯 Curated Matches</p>
                        <p className="text-neutral-400">Get matched with profiles aligned with your preferences</p>
                      </div>
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-semibold text-blue-400 mb-1">💬 Private Chat</p>
                        <p className="text-neutral-400">Send messages, voice notes, and media securely</p>
                      </div>
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <p className="font-semibold text-purple-400 mb-1">🔐 Agent Support</p>
                        <p className="text-neutral-400">Get personalized assistance from a dedicated agent</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-neutral-400">No notifications yet</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        className="p-3 bg-neutral-800 rounded-lg border border-neutral-700"
                      >
                        <p className="font-semibold">{notif.title}</p>
                        <p className="text-sm text-neutral-400">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {myPayments.length === 0 ? (
                  <p className="text-neutral-400">No payments yet</p>
                ) : (
                  <div className="space-y-2">
                    {myPayments.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="p-3 bg-neutral-800 rounded-lg border border-neutral-700 flex justify-between"
                      >
                        <div>
                          <p className="font-semibold">${payment.amount}</p>
                          <p className="text-sm text-neutral-400">
                            {payment.description}
                          </p>
                        </div>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {myTickets.length === 0 ? (
                  <p className="text-neutral-400">No support tickets yet</p>
                ) : (
                  <div className="space-y-2">
                    {myTickets.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="p-3 bg-neutral-800 rounded-lg border border-neutral-700"
                      >
                        <p className="font-semibold">{ticket.title}</p>
                        <p className="text-sm text-neutral-400">
                          {ticket.description}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge variant="outline">{ticket.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
