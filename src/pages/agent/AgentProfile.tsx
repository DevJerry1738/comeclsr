import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { rpc } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Loader2, Save, Pencil, X, MapPin, User, Sparkles, FileText, Camera } from "lucide-react";
import ProfileMediaGallery from "@/components/ProfileMediaGallery";

export default function AgentProfile({ onSave }: { onSave?: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: agentRecord, isLoading } = useQuery({
    queryKey: ["agentSelf", user?.id],
    queryFn: () => rpc.agent.getSelf(),
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    location: "",
    bio: "",
    interests: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (agentRecord) {
      setFormData({
        full_name: agentRecord.full_name || "",
        age: agentRecord.age?.toString() || "",
        location: agentRecord.location || "",
        bio: agentRecord.bio || "",
        interests: agentRecord.interests || "",
      });
      setPhotoUrl(agentRecord.profile_photo || "");
    }
  }, [agentRecord]);

  const updateProfile = useMutation({
    mutationFn: (updates: any) => rpc.agent.updateSelfProfile(updates),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["agentSelf"] });
      setIsEditing(false);
      if (onSave) onSave();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const handlePhotoUpload = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);

        // Get current session user ID
        const { data: sessionData } = await supabase.auth.getSession();
        const agentUserId = sessionData.session?.user?.id;
        if (!agentUserId) throw new Error("Not authenticated");

        // Use FormData — matching the edge function's expected format
        const formData = new FormData();
        formData.append("agentId", agentUserId);
        formData.append("file", file);

        const { data, error } = await supabase.functions.invoke("upload-agent-photo", {
          body: formData,
        });

        if (error) {
          throw new Error(error.message || "Failed to upload photo");
        }

        if (!data?.photoUrl) {
          throw new Error("No photo URL returned");
        }

        setPhotoUrl(data.photoUrl);
        toast.success("Photo uploaded! Click 'Save Profile' to confirm.");
      } catch (err: any) {
        console.error("Upload error", err);
        toast.error(err.message || "Failed to upload photo.");
      } finally {
        setIsUploading(false);
      }
    };
    fileInput.click();
  };

  const handleSave = () => {
    updateProfile.mutate({
      ...formData,
      age: formData.age ? parseInt(formData.age, 10) : null,
      profile_photo: photoUrl,
    });
  };

  const handleCancel = () => {
    // Reset form data back to saved values
    if (agentRecord) {
      setFormData({
        full_name: agentRecord.full_name || "",
        age: agentRecord.age?.toString() || "",
        location: agentRecord.location || "",
        bio: agentRecord.bio || "",
        interests: agentRecord.interests || "",
      });
      setPhotoUrl(agentRecord.profile_photo || "");
    }
    setIsEditing(false);
  };

  const interestTags = (formData.interests || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 md:p-10 text-white">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">My Profile</h2>
            <p className="text-neutral-500 text-sm">
              {isEditing ? "Make your changes below and save." : "Your public information that users see."}
            </p>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <button
              onClick={handleCancel}
              className="text-neutral-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">

          {/* Photo + Name Hero */}
          <div className="relative px-6 pt-6 pb-5 border-b border-neutral-800/60 flex items-center gap-5">
            <div className="relative group flex-none">
              <div className="w-20 h-20 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center border-2 border-neutral-700 ring-2 ring-rose-500/20">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-neutral-600" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={handlePhotoUpload}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-medium">Change</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-base font-semibold text-white focus:outline-none focus:border-rose-500/50 mb-1"
                  placeholder="Your display name"
                />
              ) : (
                <p className="text-lg font-semibold truncate">
                  {formData.full_name || <span className="text-neutral-500 italic">No name set</span>}
                </p>
              )}
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Upload className="w-3.5 h-3.5 text-neutral-500 flex-none" />
                  <button
                    onClick={handlePhotoUpload}
                    disabled={isUploading}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload new photo"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Agent</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-5">
            {/* Age & Location row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Age
                </p>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50"
                    placeholder="e.g. 24"
                  />
                ) : (
                  <p className="text-sm text-neutral-200">
                    {formData.age || <span className="text-neutral-600 italic">Not set</span>}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Nationality / Location
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50"
                    placeholder="e.g. British, London UK"
                  />
                ) : (
                  <p className="text-sm text-neutral-200">
                    {formData.location || <span className="text-neutral-600 italic">Not set</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Bio
              </p>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50 resize-none"
                  placeholder="Tell users a little about yourself..."
                />
              ) : (
                <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {formData.bio || <span className="text-neutral-600 italic">No bio added yet.</span>}
                </p>
              )}
            </div>

            {/* Interests */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Interests
              </p>
              {isEditing ? (
                <textarea
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50 resize-none"
                  placeholder="e.g. Travel, Reading, Movies (comma-separated)"
                />
              ) : interestTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interestTags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-neutral-800 border border-neutral-700/50 text-neutral-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-600 italic">No interests added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Media Gallery */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
          <ProfileMediaGallery userId={user?.id || ""} editable={isEditing} />
        </div>

        {/* Save / Cancel buttons — only visible in edit mode */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-neutral-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="bg-gradient-to-br from-rose-500 to-pink-600 hover:opacity-90 text-white min-w-[130px]"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
