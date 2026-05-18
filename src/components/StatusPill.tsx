import { CheckCircle, Clock, XCircle, AlertCircle, Zap, Shield, MessageCircle, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatusPillProps {
  status: string;
  text: string;
  icon?: LucideIcon;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export default function StatusPill({
  status,
  text,
  icon: CustomIcon,
  onClick,
  size = "md",
}: StatusPillProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
      case "assigned":
      case "resolved":
        return {
          bg: "bg-emerald-500/20",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          icon: CheckCircle,
        };
      case "pending":
      case "pending_review":
      case "pending_payment":
      case "in_progress":
        return {
          bg: "bg-amber-500/20",
          border: "border-amber-500/30",
          text: "text-amber-400",
          icon: Clock,
        };
      case "rejected":
      case "stopped":
      case "blocked":
      case "closed":
        return {
          bg: "bg-red-500/20",
          border: "border-red-500/30",
          text: "text-red-400",
          icon: XCircle,
        };
      case "submitted":
        return {
          bg: "bg-blue-500/20",
          border: "border-blue-500/30",
          text: "text-blue-400",
          icon: AlertCircle,
        };
      default:
        return {
          bg: "bg-neutral-500/20",
          border: "border-neutral-500/30",
          text: "text-neutral-400",
          icon: AlertCircle,
        };
    }
  };

  const styles = getStatusStyles(status);
  const Icon = CustomIcon || styles.icon;

  const sizeClasses = {
    sm: "px-2.5 py-1.5 gap-1.5 text-xs",
    md: "px-3 py-2 gap-2 text-sm",
    lg: "px-4 py-3 gap-2 text-base",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border ${styles.bg} ${styles.border} ${styles.text} ${sizeClasses[size]} ${
        onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
      onClick={onClick}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} />
      <span className="font-medium">{text}</span>
    </div>
  );
}
