import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AvatarRing from "@/components/AvatarRing";
import ProfileMediaGallery from "@/components/ProfileMediaGallery";
import { 
  User, Mail, Phone, MapPin, 
  Info, Heart, Edit2, Save, X, 
  Upload, Zap, History
} from "lucide-react";

export default function ProfileTab() {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "credits">("edit");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(user?.profile_photo || "");
  
  // Fetch credit balance with caching
  const { data: creditBalance } = useQuery({
    queryKey: ["user_credits", "balance", user?.id],
    queryFn: () => rpc.payment.getUserCreditsBalance(),
    enabled: !!user?.id,
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch credit transactions with caching
  const { data: creditTransactions = [] } = useQuery({
    queryKey: ["credit_transactions", user?.id],
    queryFn: () => rpc.payment.getCreditTransactions(),
    enabled: !!user?.id && activeTab === "credits",
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
    interests: "",
    gender: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        interests: user.interests || "",
        gender: user.gender || "",
      });
      setPhotoPreview(user.profile_photo || "");
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !user?.id) return;

    try {
      setLoading(true);
      
      // Upload to Supabase Storage
      const fileName = `${user.id}-${Date.now()}.${photoFile.name.split('.').pop()}`;
      const { error: uploadError } = await (supabase as any)
        .storage
        .from("profile-photos")
        .upload(`${user.id}/photo`, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = (supabase as any)
        .storage
        .from("profile-photos")
        .getPublicUrl(`${user.id}/photo`);

      // Update profile with photo URL
      const { error: updateError } = await (supabase as any)
        .from("user_profiles")
        .update({ profile_photo: data.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Profile photo updated!");
      setPhotoFile(null);
      if (refresh) await refresh();
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from("user_profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          interests: formData.interests,
          gender: formData.gender,
        })
        .eq("id", user.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      
      if (refresh) await refresh();
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/5">
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "edit"
              ? "text-rose-400"
              : "text-neutral-400 hover:text-neutral-300"
          }`}
        >
          Profile
          {activeTab === "edit" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("credits")}
          className={`px-4 py-3 font-medium text-sm transition-colors relative flex items-center gap-2 ${
            activeTab === "credits"
              ? "text-rose-400"
              : "text-neutral-400 hover:text-neutral-300"
          }`}
        >
          <Zap className="w-4 h-4" />
          Credits
          {activeTab === "credits" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
          )}
        </button>
      </div>

      {activeTab === "edit" && (
        <>
      {/* Header Area */}
      <div className="bg-surface-1 border border-surface-3 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-rose-500/20 to-pink-600/10" />
        
        <div className="relative pt-12 flex flex-col items-center text-center">
          {/* Photo Upload Section */}
          <div className="mb-6 relative group">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-rose-500/30"
              />
            ) : (
              <AvatarRing name={user.full_name || user.email} size="lg" />
            )}
            {isEditing && (
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-xs text-white font-medium flex flex-col items-center gap-1">
                  <Upload className="w-4 h-4" />
                  Upload
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Photo Upload Actions */}
          {isEditing && photoFile && (
            <div className="mb-4 flex gap-2">
              <Button
                onClick={handlePhotoUpload}
                disabled={loading}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm"
              >
                Save Photo
              </Button>
              <Button
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(user.profile_photo || "");
                }}
                variant="ghost"
                className="text-neutral-400 hover:text-white text-sm"
              >
                Cancel
              </Button>
            </div>
          )}
          
          {!isEditing ? (
            <>
              <h2 className="text-2xl font-bold">{user.full_name || "User"}</h2>
              <p className="text-neutral-400 text-sm mt-1 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </>
          ) : (
            <div className="w-full max-w-sm mt-2 space-y-3">
              <Input 
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Full Name"
                className="bg-surface-2 border-surface-3 text-center text-lg font-semibold text-white"
              />
              <p className="text-neutral-500 text-xs">Email cannot be changed directly.</p>
            </div>
          )}
        </div>

        {/* Edit Toggle */}
        <div className="absolute top-4 right-4">
          {isEditing ? (
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="bg-surface-2 hover:bg-surface-3 text-neutral-400 hover:text-white rounded-full">
                <X className="w-4 h-4" />
              </Button>
              <Button size="icon" onClick={handleSave} disabled={loading} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-full">
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="bg-white/5 hover:bg-white/10 text-white rounded-full">
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Personal Info */}
        <div className="bg-surface-1 border border-surface-3 rounded-3xl p-6 space-y-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-rose-300">
            <User className="w-5 h-5" />
            Personal Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">Gender</label>
              {!isEditing ? (
                <p className="text-sm font-medium">{user.gender || "Not specified"}</p>
              ) : (
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 text-white"
                >
                  <option value="" className="bg-neutral-900 text-white">Select Gender</option>
                  <option value="Male" className="bg-neutral-900 text-white">Male</option>
                  <option value="Female" className="bg-neutral-900 text-white">Female</option>
                  <option value="Non-binary" className="bg-neutral-900 text-white">Non-binary</option>
                  <option value="Prefer not to say" className="bg-neutral-900 text-white">Prefer not to say</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block flex items-center gap-1"><Phone className="w-3 h-3"/> Phone Number</label>
              {!isEditing ? (
                <p className="text-sm font-medium">{user.phone || "Not provided"}</p>
              ) : (
                <Input 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="bg-surface-2 border-surface-3 text-white"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</label>
              {!isEditing ? (
                <p className="text-sm font-medium">{user.location || "Not provided"}</p>
              ) : (
                <Input 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="bg-surface-2 border-surface-3 text-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* About Info */}
        <div className="bg-surface-1 border border-surface-3 rounded-3xl p-6 space-y-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-pink-400">
            <Info className="w-5 h-5" />
            About Me
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">Bio</label>
              {!isEditing ? (
                <p className="text-sm text-neutral-300 leading-relaxed min-h-[3rem]">
                  {user.bio || "No bio added yet."}
                </p>
              ) : (
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-3 text-sm min-h-[5rem] resize-none focus:outline-none focus:border-rose-500/50 text-white"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block flex items-center gap-1"><Heart className="w-3 h-3"/> Interests</label>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {user.interests ? (
                    user.interests.split(',').map((interest: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-surface-2 border border-surface-3 rounded-full text-xs text-neutral-300">
                        {interest.trim()}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No interests added.</p>
                  )}
                </div>
              ) : (
                <Input 
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  placeholder="Reading, Travel, Photography (comma separated)"
                  className="bg-surface-2 border-surface-3 text-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* Profile Media Gallery */}
        <div className="bg-surface-1 border border-surface-3 rounded-3xl p-6">
          <ProfileMediaGallery userId={user.id} editable={true} />
        </div>
      </div>
      
      {/* Action Button for Edit Mode */}
      {isEditing && (
        <div className="sticky bottom-20 md:bottom-6 z-10 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full md:w-auto px-8 py-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            {loading ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
        </>
      )}

      {/* Credits Tab */}
      {activeTab === "credits" && (
        <div className="space-y-6">
          {/* Credit Balance Card */}
          {creditBalance?.balance !== undefined && (
            <div className={`${
              creditBalance.balance > 10
                ? "bg-gradient-to-br from-rose-500/20 to-pink-600/10 border-rose-500/30"
                : "bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-500/30"
            } rounded-3xl p-6 border`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    creditBalance.balance > 10 ? "bg-rose-500/20" : "bg-amber-500/20"
                  }`}>
                    <Zap className={`w-6 h-6 ${creditBalance.balance > 10 ? "text-rose-400" : "text-amber-400"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${creditBalance.balance > 10 ? "text-rose-300" : "text-amber-300"}`}>
                      Available Credits
                    </p>
                    <p className="text-xs text-neutral-400">Current balance</p>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${creditBalance.balance > 10 ? "text-rose-400" : "text-amber-400"}`}>
                  {Math.floor(creditBalance.balance)}
                </div>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                1 credit = ~${((5 / creditBalance.balance) * Math.max(1, creditBalance.balance)).toFixed(2)} per message
              </p>
              <Link to="/deposit">
                <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold">
                  Buy More Credits
                </Button>
              </Link>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-surface-1 border border-surface-3 rounded-3xl p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
              <History className="w-5 h-5 text-blue-400" />
              Transaction History
            </h3>

            {creditTransactions && creditTransactions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {creditTransactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-surface-2 border border-surface-3 rounded-lg hover:border-rose-500/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize text-white">
                          {tx.type === "deposit"
                            ? "💰 Deposit"
                            : tx.type === "message_deduction"
                            ? "📨 Message"
                            : tx.type === "admin_adjustment"
                            ? "⚙️ Adjustment"
                            : tx.type === "refund"
                            ? "↩️ Refund"
                            : "🔄 Migration"}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {tx.reason && (
                        <p className="text-xs text-neutral-400 mt-1">{tx.reason}</p>
                      )}
                    </div>
                    <div className={`font-bold text-sm ${
                      tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-400">
                <p className="text-sm">No transactions yet. Buy credits to get started!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
