"use client";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * A sheet: bottom sheet with a grab handle on phones (or full screen),
 * a centered card on computers. Spring physics, Esc / backdrop to close.
 */
export function Sheet({
  open,
  onClose,
  children,
  className,
  full = false,
  width = 480,
  closeSide = "left",
  label,
  z = 60,
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  full?: boolean; // full screen on phones
  width?: number;
  closeSide?: "left" | "right" | "none";
  label: string;
  z?: number;
  dismissable?: boolean;
}) {
  const drag = useDragControls();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissable && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, dismissable]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex: z }} role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissable && onClose()}
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center md:items-center md:p-6">
            <motion.div
              className={cn(
                "pointer-events-auto relative w-full overflow-hidden bg-[#0d0e0b] shadow-[0_-20px_80px_-20px_rgba(0,0,0,.9)] ring-1 ring-white/10",
                full
                  ? "h-[100dvh] rounded-none md:h-auto md:max-h-[92dvh] md:rounded-[24px]"
                  : "max-h-[94dvh] rounded-t-[24px] md:rounded-[24px]",
                className,
              )}
              style={{ maxWidth: width }}
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 340, mass: 0.9 }}
              drag={full || !dismissable ? false : "y"}
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, i) => {
                if (i.offset.y > 120 || i.velocity.y > 600) onClose();
              }}
            >
              {!full && (
                <div
                  className="flex h-6 cursor-grab touch-none items-center justify-center md:hidden"
                  onPointerDown={(e) => drag.start(e)}
                >
                  <span className="h-1 w-10 rounded-full bg-white/25" />
                </div>
              )}
              {closeSide !== "none" && dismissable && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className={cn(
                    "absolute top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-fg hover:bg-white/[0.14] md:top-4",
                    closeSide === "left" ? "left-3 md:left-4" : "right-3 md:right-4",
                    !full && "top-5",
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className={cn("no-scrollbar overflow-y-auto overscroll-contain", full ? "h-full md:max-h-[92dvh]" : "max-h-[calc(94dvh-24px)]")}>
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
