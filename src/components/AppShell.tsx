import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { Home, MessageCircle, Ticket, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightAction?: ReactNode;
  overflowHidden?: boolean;
}

export default function AppShell({
  children,
  title = "ComeClsr",
  showBackButton = false,
  onBackClick,
  rightAction,
  overflowHidden = false,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path === "/messages" && location.pathname === "/messages") return true;
    if (path === "/tickets" && location.pathname === "/tickets") return true;
    if (path === "/dashboard?tab=profile" && location.pathname === "/dashboard" && location.search.includes("tab=profile")) return true;
    return false;
  };

  const navTabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: MessageCircle, label: "Chat", path: "/messages" },
    { icon: Ticket, label: "Support", path: "/tickets" },
    { icon: User, label: "Profile", path: "/dashboard?tab=profile" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white overflow-hidden">
      {/* TopBar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between h-14">
        <div className="flex items-center gap-3 flex-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-neutral-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">♥</span>
            </div>
            <h1 className="font-semibold text-base truncate">{title}</h1>
          </div>
        </div>
        {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${overflowHidden ? 'overflow-hidden flex flex-col' : 'overflow-y-auto pb-[calc(1rem+var(--bottom-nav-h))]'}`}>
        <div className={`animate-in fade-in slide-in-from-bottom-2 duration-200 ${overflowHidden ? 'flex flex-col flex-1 h-full' : ''}`}>
          {children}
        </div>
      </main>

      {/* BottomNav - Mobile only */}
      <nav className="sticky bottom-0 z-40 md:hidden border-t border-white/10 bg-neutral-900/50 backdrop-blur-xl h-16">
        <div className="flex items-center justify-around h-full">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-h-[44px] min-w-[44px] transition-all duration-200 relative group ${
                  active ? "text-rose-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
                {active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
