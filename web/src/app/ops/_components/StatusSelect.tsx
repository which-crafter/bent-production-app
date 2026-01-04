/**
 * Inline status select component with auto-save.
 * 
 * Provides immediate feedback during save and reverts on error.
 * Refreshes page data after successful save to update filters/stale logic.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "../actions";
import type { LeadStatus } from "../types";

interface StatusSelectProps {
  leadId: string;
  currentStatus: LeadStatus;
}

/**
 * Status select dropdown with auto-save on change.
 * 
 * Features:
 * - Optimistic UI update (status changes immediately)
 * - Visual feedback: "Saving..." → "Saved" → idle
 * - Error handling: reverts to previous status on failure
 * - Auto-refresh after save to update filters/stale detection
 * 
 * @param leadId - UUID of the lead to update
 * @param currentStatus - Current status value (used for initial state)
 */
export function StatusSelect({ leadId, currentStatus }: StatusSelectProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  /**
   * Handles status change with optimistic update and error recovery.
   * 
   * @param newStatus - New status value selected by user
   */
  async function handleChange(newStatus: LeadStatus) {
    const previousStatus = status;
    setStatus(newStatus); // Optimistic update
    setSaveState("saving");
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus);

      if (!result.success) {
        setStatus(previousStatus); // Revert on error
        setSaveState("error");
        setErrorMessage(result.error || "Failed to update status");
        // Clear error after 3 seconds
        setTimeout(() => {
          setSaveState("idle");
          setErrorMessage(null);
        }, 3000);
      } else {
        setSaveState("saved");
        // Refresh the page data so filters/stale logic apply correctly
        router.refresh();
        // Clear saved message after 1 second
        setTimeout(() => {
          setSaveState("idle");
        }, 1000);
      }
    });
  }

  const isDisabled = isPending || saveState === "saving";

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as LeadStatus)}
        disabled={isDisabled}
        className={`text-xs font-medium rounded px-2 py-1 border ${
          isDisabled
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border-zinc-300 dark:border-zinc-700 cursor-not-allowed"
            : "bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        }`}
      >
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="qualified">Qualified</option>
        <option value="lost">Lost</option>
      </select>
      {saveState === "saving" && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Saving...</span>
      )}
      {saveState === "saved" && (
        <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
      )}
      {saveState === "error" && errorMessage && (
        <span className="text-xs text-red-600 dark:text-red-400" title={errorMessage}>
          Error
        </span>
      )}
    </div>
  );
}

