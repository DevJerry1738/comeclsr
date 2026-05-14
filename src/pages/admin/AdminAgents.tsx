import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
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
import { ArrowLeft, Heart, LogOut, Copy, Check, Trash2, Ban, CheckCircle, Download } from "lucide-react";

interface Agent {
  id: string;
  email: string;
  full_name?: string;
  status: string;
  role: string;
}

interface SeededCredential {
  email: string;
  password: string;
  username: string;
  success: boolean;
  user_id?: string;
  error?: string;
}

export default function AdminAgents() {
  const { user, logout } = useAuth();
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [seededCredentials, setSeededCredentials] = useState<SeededCredential[] | null>(null);
  const [isSeeded, setIsSeeded] = useState(false);
  const queryClient = useQueryClient();


  // Fetch all agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents", "list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, status, role")
        .eq("role", "agent");
      return data as Agent[];
    },
    enabled: user?.role === "admin",
  });

  // Seed all 15 agents mutation
  const seedAgents = useMutation({
    mutationFn: async () => {
      const result = await rpc.agent.seedAuthUsers();
      return result;
    },
    onSuccess: (data) => {
      console.log('Agents seeded successfully:', data);
      setSeededCredentials(data.credentials || []);
      setIsSeeded(true);
      setShowCredentials(true);
      toast.success(`${data.summary?.successful || 15} agents seeded successfully!`);
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
    },
    onError: (error: any) => {
      console.error('Agent seeding failed:', error);
      toast.error(error.message || "Failed to seed agents");
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (agentId: string) => {
      await rpc.admin.deleteUser(agentId);
    },
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete agent");
    }
  });

  const toggleAgentStatus = useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string, status: string }) => {
      await rpc.admin.updateUser(agentId, { status });
    },
    onSuccess: () => {
      toast.success("Agent status updated");
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update agent status");
    }
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportCredentialsAsCSV = () => {
    if (!seededCredentials) return;
    
    const headers = ["Email", "Username", "Password", "Status"];
    const rows = seededCredentials.map((cred) => [
      cred.email,
      cred.username,
      cred.success ? cred.password : "Failed",
      cred.success ? "Success" : `Error: ${cred.error}`,
    ]);
    
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-credentials-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Credentials exported!");
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
          <h1 className="font-semibold">Agent Management</h1>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Agents</h2>
            <p className="text-sm text-neutral-500">
              {agentsLoading ? "Loading..." : `${agents?.length || 0} total`}
            </p>
          </div>
          {!isSeeded && (
            <Button
              onClick={() => seedAgents.mutate()}
              disabled={seedAgents.isPending}
              className="bg-gradient-to-r from-rose-500 to-pink-600"
            >
              {seedAgents.isPending ? "Seeding..." : "Seed All 15 Agents"}
            </Button>
          )}
          {isSeeded && (
            <Button
              onClick={exportCredentialsAsCSV}
              variant="outline"
              className="border-neutral-600 text-neutral-300 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Credentials
            </Button>
          )}
        </div>

        {agentsLoading ? (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">Loading agents...</p>
          </Card>
        ) : agents && agents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-neutral-900/60 border-neutral-800">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {(agent.full_name || agent.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{agent.full_name || "Agent"}</p>
                      <p className="text-xs text-neutral-500">{agent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-between w-full">
                    <Badge
                      className={
                        agent.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-neutral-500/20 text-neutral-400"
                      }
                    >
                      {agent.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-white"
                        onClick={() => toggleAgentStatus.mutate({ 
                          agentId: agent.id, 
                          status: agent.status === "active" ? "suspended" : "active" 
                        })}
                        disabled={toggleAgentStatus.isPending}
                        title={agent.status === "active" ? "Suspend Agent" : "Activate Agent"}
                      >
                        {agent.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-red-400"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this agent? This cannot be undone.")) {
                            deleteAgent.mutate(agent.id);
                          }
                        }}
                        disabled={deleteAgent.isPending}
                        title="Delete Agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">No agents seeded yet. Click "Seed All 15 Agents" to get started.</p>
          </Card>
        )}
      </div>

      {/* Seeded Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={(open) => {
        if (!open) {
          setShowCredentials(false);
        }
      }}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-400">✓ Agents Seeded Successfully</DialogTitle>
            <DialogDescription className="text-neutral-400">
              All 15 agents are ready to log in. Copy credentials and share securely with each agent.
            </DialogDescription>
          </DialogHeader>

          {seededCredentials && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 mb-4">
                <p className="text-xs text-emerald-400 font-medium">✓ Ready to Use</p>
                <p className="text-xs text-neutral-300 mt-1">
                  {seededCredentials.filter((c) => c.success).length} agents created successfully. Agents can now log in using their email and password.
                </p>
              </div>

              {/* Credentials Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">Username</th>
                      <th className="text-left py-3 px-4 text-neutral-400 font-medium">Password</th>
                      <th className="text-center py-3 px-4 text-neutral-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seededCredentials.map((cred, idx) => (
                      <tr key={idx} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                        <td className="py-3 px-4 text-white font-mono text-xs">{cred.email}</td>
                        <td className="py-3 px-4 text-white font-mono text-xs">{cred.username}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="text-neutral-300 font-mono text-xs bg-neutral-800/50 px-2 py-1 rounded">
                              {cred.success ? cred.password : "—"}
                            </code>
                            {cred.success && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
                                onClick={() => copyToClipboard(cred.password, `password-${idx}`)}
                              >
                                {copiedField === `password-${idx}` ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={
                              cred.success
                                ? "bg-emerald-500/20 text-emerald-400 text-xs"
                                : "bg-red-500/20 text-red-400 text-xs"
                            }
                          >
                            {cred.success ? "✓ Created" : "✗ Failed"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    const allEmails = seededCredentials.filter((c) => c.success).map((c) => c.email).join(", ");
                    copyToClipboard(allEmails, "all-emails");
                    toast.success("All emails copied!");
                  }}
                  variant="outline"
                  className="flex-1 border-neutral-600 text-neutral-300 hover:text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Emails
                </Button>
                <Button
                  onClick={exportCredentialsAsCSV}
                  variant="outline"
                  className="flex-1 border-neutral-600 text-neutral-300 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => setShowCredentials(false)}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
