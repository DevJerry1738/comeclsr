import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AvatarRingProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}

export default function AvatarRing({ name, imageUrl, size = "md", online = false }: AvatarRingProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs ring-2",
    md: "w-12 h-12 text-sm ring-2",
    lg: "w-16 h-16 text-base ring-2",
  };

  const dotClasses = {
    sm: "w-2 h-2 -bottom-0.5 -right-0.5",
    md: "w-3 h-3 -bottom-1 -right-1",
    lg: "w-4 h-4 -bottom-1 -right-1",
  };

  return (
    <div className="relative inline-block">
      <Avatar
        className={`${sizeClasses[size]} ring-offset-2 ring-offset-neutral-950 bg-gradient-to-br from-rose-500 to-pink-600 font-bold`}
      >
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      {online && (
        <div
          className={`absolute ${dotClasses[size]} bg-emerald-500 rounded-full border-2 border-neutral-950 ring-1 ring-emerald-400`}
        />
      )}
    </div>
  );
}
