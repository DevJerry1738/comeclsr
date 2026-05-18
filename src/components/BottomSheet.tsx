import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* BottomSheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-neutral-900 rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        } max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-neutral-900 border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-neutral-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 py-6 pb-8">{children}</div>
      </div>
    </>
  );
}
