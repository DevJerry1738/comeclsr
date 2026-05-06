import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { supabase } from "@/lib/supabase";
import {
  CreditCard, Shield, MessageCircle, Ticket, LogOut, Bell,
  CheckCircle, Clock, XCircle, AlertCircle
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [myKyc, setMyKyc] = useState<any>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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

  if (!user) return null;
  if (loading)
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-neutral-900 border-neutral-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
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
                <div className="pt-4">
                  <Link to="/messages">
                    <Button className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" /> Start
                      Conversation
                    </Button>
                  </Link>
                </div>
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
