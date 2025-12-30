"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logContact } from "../actions";

interface LogContactProps {
  leadId: string;
  currentNote?: string;
}

export function LogContact({ leadId, currentNote }: LogContactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSave() {
    setError(null);
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      setError("Note is required");
      return;
    }

    startTransition(async () => {
      const result = await logContact(leadId, trimmedNote, currentNote || null);

      if (!result.success) {
        setError(result.error || "Failed to log contact");
      } else {
        setNote("");
        setIsExpanded(false);
        router.refresh();
      }
    });
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        Log contact
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contact note (required)"
          required
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
            if (e.key === "Escape") {
              setIsExpanded(false);
              setNote("");
              setError(null);
            }
          }}
          className="flex-1 px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isPending || !note.trim()}
          className="px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => {
            setIsExpanded(false);
            setNote("");
            setError(null);
          }}
          disabled={isPending}
          className="px-2 py-1 text-xs font-medium rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

