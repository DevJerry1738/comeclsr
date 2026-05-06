import { Routes, Route, Navigate } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Messages from "./pages/Messages"
import Tickets from "./pages/Tickets"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminAgents from "./pages/admin/AdminAgents"
import AdminPayments from "./pages/admin/AdminPayments"
import AdminKyc from "./pages/admin/AdminKyc"
import AdminConversations from "./pages/admin/AdminConversations"
import AdminTickets from "./pages/admin/AdminTickets"
import AdminSettings from "./pages/admin/AdminSettings"
import NotFound from "./pages/NotFound"
import { useAuth } from "./hooks/useAuth"

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/agents" element={<ProtectedRoute requireAdmin><AdminAgents /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute requireAdmin><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/kyc" element={<ProtectedRoute requireAdmin><AdminKyc /></ProtectedRoute>} />
      <Route path="/admin/conversations" element={<ProtectedRoute requireAdmin><AdminConversations /></ProtectedRoute>} />
      <Route path="/admin/tickets" element={<ProtectedRoute requireAdmin><AdminTickets /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
