import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ArrowLeft, Heart, LogOut, Plus, Copy, Check } from "lucide-react";

interface Agent {
  id: string;
  email: string;
  full_name?: string;
  status: string;
  role: string;
}

interface CreatedAgent {
  user_id: string;
  username: string;
  password: string;
  full_name: string;
}

export default function AdminAgents() {
  const { user, logout } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState({ fullName: "", email: "" });
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

  // Create agent mutation
  const createAgent = useMutation({
    mutationFn: async (form: { fullName: string; email: string }) => {
      return rpc.agent.createAccount(form.fullName, form.email);
    },
    onSuccess: (data) => {
      setCreatedAgent(data);
      setShowCredentials(true);
      toast.success("Agent created successfully!");
      setAgentForm({ fullName: "", email: "" });
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create agent");
    },
  });

  const handleCreateClick = () => {
    if (!agentForm.fullName.trim() || !agentForm.email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    createAgent.mutate(agentForm);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-rose-500 to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
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
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        agent.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-neutral-500/20 text-neutral-400"
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">No agents created yet. Create one to get started.</p>
          </Card>
        )}
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-300 block mb-2">
                Full Name
              </label>
              <input
                className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                placeholder="Agent Name"
                value={agentForm.fullName}
                onChange={(e) =>
                  setAgentForm({ ...agentForm, fullName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300 block mb-2">
                Email Address
              </label>
              <input
                className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                placeholder="agent@example.com"
                type="email"
                value={agentForm.email}
                onChange={(e) =>
                  setAgentForm({ ...agentForm, email: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-neutral-400">
              A login username and password will be auto-generated for the agent.
            </p>
            <Button
              onClick={handleCreateClick}
              disabled={createAgent.isPending}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600"
            >
              {createAgent.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <AlertDialog open={showCredentials} onOpenChange={setShowCredentials}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Agent Created Successfully</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Save these credentials somewhere safe. The agent will use these to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {createdAgent && (
            <div className="space-y-4 bg-neutral-800/50 p-4 rounded-lg">
              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase">
                  Username
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={createdAgent.username}
                    readOnly
                    className="flex-1 p-2 rounded bg-neutral-700 border border-neutral-600 text-white text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600"
                    onClick={() => copyToClipboard(createdAgent.username, "username")}
                  >
                    {copiedField === "username" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 uppercase">
                  Password
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={createdAgent.password}
                    readOnly
                    className="flex-1 p-2 rounded bg-neutral-700 border border-neutral-600 text-white text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600"
                    onClick={() => copyToClipboard(createdAgent.password, "password")}
                  >
                    {copiedField === "password" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-neutral-700 text-neutral-300 hover:text-white">
              Close
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
