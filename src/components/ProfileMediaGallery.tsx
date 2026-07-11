import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { rpc } from "@/lib/rpc";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "./ui/button";

interface ProfileMediaGalleryProps {
  userId: string;
  editable?: boolean;
}

export default function ProfileMediaGallery({ userId, editable = false }: ProfileMediaGalleryProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ["profileMedia", userId],
    queryFn: () => rpc.profile.getMedia(userId),
    enabled: !!userId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `gallery/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload file to storage");
      }

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        throw new Error("Failed to get public URL");
      }

      return rpc.profile.addMedia(userId, publicUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileMedia", userId] });
      toast.success("Image added to gallery!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload image.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (media: { id: number; media_url: string }) => {
      // Extract file path from URL to delete it from storage too
      try {
        const urlObj = new URL(media.media_url);
        const pathParts = urlObj.pathname.split("/profile-photos/");
        if (pathParts.length > 1) {
          const filePath = decodeURIComponent(pathParts[1]);
          await supabase.storage.from("profile-photos").remove([filePath]);
        }
      } catch (e) {
        console.error("Could not delete from storage bucket", e);
      }
      return rpc.profile.deleteMedia(media.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profileMedia", userId] });
      toast.success("Image removed from gallery.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete image.");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (only images are supported).");
      return;
    }

    try {
      setIsUploading(true);
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e: any) => handleFileChange(e);
    fileInput.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-rose-400" />
          Photos ({mediaItems.length})
        </h3>
        {editable && (
          <Button
            onClick={triggerUpload}
            disabled={isUploading}
            size="sm"
            className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs px-3 py-1.5 rounded-xl h-auto"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Plus className="w-3.5 h-3.5 mr-1" />
            )}
            Add Photo
          </Button>
        )}
      </div>

      {mediaItems.length === 0 ? (
        <div className="bg-neutral-900/20 border border-neutral-800/60 rounded-2xl p-8 text-center">
          <ImageIcon className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No photos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl bg-neutral-900 overflow-hidden border border-white/5 group shadow-sm hover:border-white/10 transition-all cursor-pointer"
            >
              <img
                src={item.media_url}
                alt="Gallery item"
                onClick={() => setSelectedImage(item.media_url)}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {editable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Remove this image from your gallery?")) {
                      deleteMutation.mutate(item);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600/90 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Enlarged gallery preview"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
