"use client";

import { useState, useTransition } from "react";
import { createLead } from "../actions";
import type { LeadStatus } from "../types";

export function CreateLeadForm() {
  const [name, setName] = useState("");
  const [companyOrClient, setCompanyOrClient] = useState("");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Lead name is required");
      return;
    }

    startTransition(async () => {
      const result = await createLead(
        name.trim(),
        status,
        companyOrClient.trim() || null,
        source.trim() || null,
        notes.trim() || null
      );

      if (!result.success) {
        setError(result.error || "Failed to create lead");
      }
      // If successful, the redirect will happen, so we don't need to clear the form here
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
        Create Lead
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="lead-name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Lead Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lead-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Enter lead name"
            />
          </div>

          <div>
            <label
              htmlFor="company-client"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Company/Client
            </label>
            <input
              id="company-client"
              type="text"
              value={companyOrClient}
              onChange={(e) => setCompanyOrClient(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Enter company or client name"
            />
          </div>

          <div>
            <label
              htmlFor="lead-status"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="lead-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              required
              disabled={isPending}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="lead-source"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Source
            </label>
            <input
              id="lead-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Enter source"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="lead-notes"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Notes
          </label>
          <textarea
            id="lead-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-y"
            placeholder="Enter notes"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

