"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { IModerationAuditLog } from "@/types/accessibility";

interface AccessibleModerationToolsProps {
  escrowId: string;
}

export default function AccessibleModerationTools({ escrowId }: AccessibleModerationToolsProps) {
  const [logs, setLogs] = useState<IModerationAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reason, setReason] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Modal / Disclosure focus-trap anchor state variables
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 1. Fetch historical action logs with explicit keyboard focus loops
  useEffect(() => {
    let isSubscribed = true;
    async function fetchAuditLogs() {
      try {
        const res = await fetch(`/api/moderation/logs?escrowId=${escrowId}`);
        if (!res.ok) throw new Error("Could not resolve historical audit registries.");
        const data = await res.json();
        if (isSubscribed) {
          setLogs(data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch accessibility audit registries.");
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    void fetchAuditLogs();
    return () => {
      isSubscribed = false;
    };
  }, [escrowId]);

  // 2. Programmatic accessibility keyboard trap container constraints
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus(); // Shift focus inside modal on load

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Explicit return tracking rule: restore focus to the operational baseline trigger element
    triggerButtonRef.current?.focus();
  };

  const handleExecuteFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("An explicit audit rationale is required under section 508 parameters.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/moderation/freeze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ escrowId, reason }),
        });

        if (!res.ok) throw new Error();

        toast.success("Compliance circuit breaker deployed successfully.");
        setReason("");
        handleCloseModal();
        
        // Refresh logs list tracking state
        const updatedRes = await fetch(`/api/moderation/logs?escrowId=${escrowId}`);
        if (updatedRes.ok) setLogs(await updatedRes.json());
      } catch {
        toast.error("Failed to execute network security lock down action.");
      }
    });
  };

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="text-sm p-4 text-muted-foreground animate-pulse">
        Compiling screen-reader asset templates...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl" role="region" aria-label="Escrow Moderation Panel">
      
      {/* HEADER CONTROLS SECTION */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">VPAT Administrative Moderation Engine</h3>
          <p className="text-xs text-muted-foreground">Section 508 and WCAG 2.1 AA compliant transaction management framework.</p>
        </div>
        <button
          ref={triggerButtonRef}
          onClick={handleOpenModal}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="h-10 px-4 bg-destructive text-white hover:bg-destructive/90 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Deploy Safe-Freeze
        </button>
      </div>

      {/* ACCESSIBLE AUDIT LOG TRACKING GRID */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold mb-4" id="audit-table-heading">Historical Enforcement Records Matrix</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" aria-labelledby="audit-table-heading">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-2">Timestamp Node</th>
                <th className="py-3 px-2">Action Dispatched</th>
                <th className="py-3 px-2">Target Address Context</th>
                <th className="py-3 px-2">Enforcement Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-2"><span className="font-semibold">{log.action}</span></td>
                    <td className="py-3 px-2 font-mono text-xs truncate max-w-[120px]">{log.targetUser}</td>
                    <td className="py-3 px-2 text-muted-foreground text-xs">{log.reason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-muted-foreground italic">
                    No active regulatory enforcement records bound to this entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL LIGHTBOX DIALOG OVERLAY CONTAINER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in" role="none">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
            className="bg-card border border-border text-card-foreground w-full max-w-lg p-6 rounded-xl shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h4 id="modal-title" className="text-base font-bold text-destructive">
                Confirm Emergency Asset Freeze Allocation
              </h4>
              <button
                ref={closeButtonRef}
                onClick={handleCloseModal}
                aria-label="Close dialog window"
                className="text-muted-foreground hover:text-foreground text-lg font-bold p-1 cursor-pointer rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                ✕
              </button>
            </div>

            <p id="modal-desc" className="text-xs text-muted-foreground leading-relaxed">
              Deploying this circuit breaker forces immediate transactional lockup across all participants on the active ledger. This transaction emits a public audit footprint.
            </p>

            <form onSubmit={handleExecuteFreeze} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="freeze-reason" className="text-xs font-semibold block text-foreground">
                  Enforcement Rationale (Required)
                </label>
                <textarea
                  id="freeze-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide explicit compliance documentation details..."
                  className="w-full text-sm p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="h-10 px-4 border border-border hover:bg-muted font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-4 bg-destructive hover:bg-destructive/90 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Executing Lock..." : "Broadcast Freeze Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}