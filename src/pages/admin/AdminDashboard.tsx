import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router";
import {
  Users, CreditCard, Shield, MessageCircle, Ticket, DollarSign,
  ArrowRight, Heart, LogOut, Activity, TrendingUp, UserCheck, AlertCircle, Bell
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: stats = {}, error: statsError } = useQuery({
    queryKey: ['admin', 'dashboardStats'],
    queryFn: () => rpc.admin.dashboardStats(),
    enabled: user?.role === 'admin',
  });

  if (!user || user.role !== "admin") return null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 mx-auto mb-4 animate-spin" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <Card className="bg-neutral-900/80 border-neutral-800 w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">Dashboard Error</h3>
                <p className="text-sm text-neutral-400 mb-4">{statsError.message || "Failed to load dashboard stats"}</p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", link: "/admin/users" },
    { label: "Total Agents", value: stats?.totalAgents || 0, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", link: "/admin/agents" },
    { label: "Total Payments", value: `$${stats?.totalPaymentsAmount?.toFixed(2) || "0.00"}`, icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10", link: "/admin/payments" },
    { label: "Pending Payments", value: stats?.pendingPayments || 0, icon: CreditCard, color: "text-rose-400", bg: "bg-rose-500/10", link: "/admin/payments" },
    { label: "Active Conversations", value: stats?.activeConversations || 0, icon: MessageCircle, color: "text-violet-400", bg: "bg-violet-500/10", link: "/admin/conversations" },
    { label: "Open Tickets", value: stats?.openTickets || 0, icon: Ticket, color: "text-orange-400", bg: "bg-orange-500/10", link: "/admin/tickets" },
  ];

  const quickLinks = [
    { label: "Users", desc: "Manage all user accounts", icon: Users, link: "/admin/users", color: "text-blue-400" },
    { label: "Agents", desc: "Create & assign agents", icon: Shield, link: "/admin/agents", color: "text-violet-400" },
    { label: "Payments", desc: "Review & approve payments", icon: CreditCard, link: "/admin/payments", color: "text-rose-400" },
    { label: "KYC", desc: "Verify user identities", icon: Shield, link: "/admin/kyc", color: "text-emerald-400" },
    { label: "Conversations", desc: "Monitor all chats", icon: MessageCircle, link: "/admin/conversations", color: "text-amber-400" },
    { label: "Tickets", desc: "Support management", icon: Ticket, link: "/admin/tickets", color: "text-orange-400" },
    { label: "Broadcasts", desc: "Send notifications", icon: Bell, link: "/admin/notifications", color: "text-rose-400" },
    { label: "Settings", desc: "System configuration", icon: Activity, link: "/admin/settings", color: "text-neutral-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <div>
            <h1 className="font-semibold">Admin Control</h1>
            <p className="text-xs text-neutral-500">ComeClsr Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
          <p className="text-neutral-400">Full system control and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer" onClick={() => navigate(stat.link)}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <Card key={item.label} className="bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/60 transition-all cursor-pointer group" onClick={() => navigate(item.link)}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-neutral-500">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
