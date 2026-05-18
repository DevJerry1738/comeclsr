import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AvatarRing from "@/components/AvatarRing";
import { 
  User, Mail, Phone, MapPin, 
  Info, Heart, Edit2, Save, X
} from "lucide-react";

export default function ProfileTab() {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      
      // Refresh user context
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
      {/* Header Area */}
      <div className="bg-surface-1 border border-surface-3 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-rose-500/20 to-pink-600/10" />
        
        <div className="relative pt-12 flex flex-col items-center text-center">
          <div className="mb-4 relative group">
            <AvatarRing name={user.full_name || user.email} size="lg" />
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-xs text-white font-medium">Change</span>
              </div>
            )}
          </div>
          
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
                className="bg-surface-2 border-surface-3 text-center text-lg font-semibold"
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
                  className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
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
                  className="bg-surface-2 border-surface-3"
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
                  className="bg-surface-2 border-surface-3"
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
                  className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-3 text-sm min-h-[5rem] resize-none focus:outline-none focus:border-rose-500/50"
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
                  className="bg-surface-2 border-surface-3"
                />
              )}
            </div>
          </div>
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
    </div>
  );
}
