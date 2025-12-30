"use client";

import { useState, useTransition } from "react";
import { convertLeadToProject } from "../actions";

interface ConvertLeadFormProps {
  leadId: string;
}

export function ConvertLeadForm({ leadId }: ConvertLeadFormProps) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    startTransition(async () => {
      const result = await convertLeadToProject(
        leadId,
        projectName.trim(),
        clientName.trim() || null
      );

      if (!result.success) {
        setError(result.error || "Failed to convert lead to project");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 min-w-[400px]">
      <div className="flex gap-2 items-end">
        <div className="flex-1 min-w-0">
          <label
            htmlFor={`project-name-${leadId}`}
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-0.5"
          >
            Project Name
          </label>
          <input
            id={`project-name-${leadId}`}
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            disabled={isPending}
            className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Project name"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label
            htmlFor={`client-name-${leadId}`}
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-0.5"
          >
            Client Name (optional)
          </label>
          <input
            id={`client-name-${leadId}`}
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            disabled={isPending}
            className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Client name"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !projectName.trim()}
          className="px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap h-[26px]"
        >
          {isPending ? "Converting..." : "Convert"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}

