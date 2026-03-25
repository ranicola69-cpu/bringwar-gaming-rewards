import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-card p-6 shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ className, children, onClose }: { className?: string, children: React.ReactNode, onClose?: () => void }) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div className="flex flex-col space-y-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function DialogTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h2 className={cn("text-xl font-bold font-display", className)}>{children}</h2>;
}

export function DialogDescription({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}
