import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { ArrowLeft, Heart, LogOut, Copy, Check, Trash2, Ban, CheckCircle, Download, Edit2, Upload } from "lucide-react";
import ProfileMediaGallery from "@/components/ProfileMediaGallery";

interface Agent {
  id: string;
  email: string;
  full_name?: string;
  profile_photo?: string;
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

interface EditFormState {
  fullName: string;
  email: string;
  password?: string;
}

export default function AdminAgents() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showCredentials, setShowCredentials] = useState(false);
  const [seededCredentials, setSeededCredentials] = useState<SeededCredential[] | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ fullName: "", email: "", password: "" });
  
  // Fetch all agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents", "list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, status, role, profile_photo")
        .eq("role", "agent");
      return data as Agent[];
    },
    enabled: user?.role === "admin",
    staleTime: 10 * 1000, 
    gcTime: 5 * 60 * 1000, 
  });

  // Check if agents are seeded on component mount
  useEffect(() => {
    if (agents && agents.length > 0) {
      const hasSeededAgents = agents.some((a) => /agent_00\d@comeclsr\.com/.test(a.email));
      setIsSeeded(hasSeededAgents);
    }
  }, [agents]);

  // Seed all 15 agents mutation
  const seedAgents = useMutation({
    mutationFn: async () => {
      const result = await rpc.agent.seedAuthUsers();
      return result;
    },
    onSuccess: (data: any) => {
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

  const updateAgent = useMutation({
    mutationFn: async (data: { agentId: string; fullName: string; email: string }) => {
      // Use RPC function to update agent (bypasses RLS)
      await rpc.agent.updateAgent(data.agentId, { full_name: data.fullName, status: undefined });
    },
    onSuccess: () => {
      toast.success("Agent updated successfully");
      setShowEditDialog(false);
      setEditingAgent(null);
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update agent");
    },
  });

  const exportCredentialsAsCSV = () => {
    // Existing implementation remains unchanged
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
  const copyAllEmails = () => {
    if (!seededCredentials) return;
    const emails = seededCredentials.map((cred) => cred.email).join(', ');
    navigator.clipboard.writeText(emails)
      .then(() => toast.success('All emails copied to clipboard!'))
      .catch(() => toast.error('Failed to copy emails'));
  };
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
    setPhotoPreview(agent.profile_photo || "");
    setEditForm({ fullName: agent.full_name || "", email: agent.email, password: "" });
    setShowEditDialog(true);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !editingAgent?.id) return;
    try {
      setLoadingUpload(true);
      
      const formData = new FormData();
      formData.append("agentId", editingAgent.id);
      formData.append("file", photoFile);

      // Invoke the edge function which uses service_role key to bypass RLS policies
      const { data, error } = await supabase.functions.invoke("upload-agent-photo", {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || "Failed to upload photo via Edge Function");
      }

      const photoUrl = data?.photoUrl;
      if (!photoUrl) {
        throw new Error("No photo URL returned from upload");
      }
      
      // Update local state immediately to reflect the new photo
      const updatedAgent = { ...editingAgent, profile_photo: photoUrl };
      setEditingAgent(updatedAgent);
      setPhotoPreview(photoUrl);
      setPhotoFile(null);
      
      // Update the agents list in cache immediately
      queryClient.setQueryData(["agents", "list"], (oldData: Agent[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(agent => 
          agent.id === editingAgent.id ? updatedAgent : agent
        );
      });
      
      toast.success("Profile photo updated!");
      // Also invalidate query for eventual sync
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingAgent || !editForm.fullName.trim() || !editForm.email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateAgent.mutate({
      agentId: editingAgent.id,
      fullName: editForm.fullName,
      email: editForm.email,
    });
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
          <h1 className="font-semibold">Agent Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Agents</h2>
            <p className="text-sm text-neutral-500">{agentsLoading ? "Loading..." : `${agents?.length || 0} total`}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isSeeded && (
              <Button onClick={() => seedAgents.mutate()} disabled={seedAgents.isPending} className="bg-gradient-to-r from-rose-500 to-pink-600">
                {seedAgents.isPending ? "Seeding..." : "Seed All 15 Agents"}
              </Button>
            )}
            {isSeeded && (
              <Button onClick={exportCredentialsAsCSV} variant="outline" className="border-neutral-600 text-neutral-300 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Export Credentials
              </Button>
            )}
          </div>
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
                    {agent.profile_photo ? (
                      <img src={agent.profile_photo} alt={agent.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {(agent.full_name || agent.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{agent.full_name || "Agent"}</p>
                      <p className="text-xs text-neutral-500">{agent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-between w-full">
                    <Badge className={agent.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-500/20 text-neutral-400"}>
                      {agent.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-blue-400" onClick={() => handleEditClick(agent)} title="Edit Agent">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white" onClick={() => toggleAgentStatus.mutate({ agentId: agent.id, status: agent.status === "active" ? "suspended" : "active" })} title={agent.status === "active" ? "Suspend Agent" : "Activate Agent"}>
                        {agent.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">No agents found.</p>
          </Card>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription className="sr-only">Edit agent profile information and photo</DialogDescription>
          </DialogHeader>
          {editingAgent && (
            <div className="space-y-5">
              <div className="mb-2 flex items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-rose-500/30" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-neutral-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-rose-400 hover:underline">
                    <Upload className="w-4 h-4" />
                    Choose Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </label>
                  {photoFile && (
                    <div className="flex gap-2">
                      <Button onClick={handlePhotoUpload} disabled={loadingUpload} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
                        Save Photo
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <input 
                className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                value={editForm.fullName} 
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} 
                placeholder="Full Name"
                disabled={loadingUpload}
              />
              <input 
                className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                value={editForm.email} 
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                placeholder="Email"
                disabled={loadingUpload}
              />
              <Button 
                onClick={handleSaveEdit} 
                disabled={loadingUpload || updateAgent.isPending}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateAgent.isPending ? "Saving..." : "Save Changes"}
              </Button>

              <div className="border-t border-neutral-800 pt-4">
                <ProfileMediaGallery userId={editingAgent.id} editable={true} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-400">✓ Agents Seeded Successfully</DialogTitle>
            <DialogDescription className="sr-only">
              Credentials and export options for the seeded agent accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 border-neutral-600 text-neutral-300 hover:text-white"
              onClick={copyAllEmails}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
