/**
 * Project name editor component - inline editing for name and client_name.
 * 
 * Module 2 — Portion D: Project Detail Page
 * 
 * Allows editing of projects.name and projects.client_name only.
 * Other fields are read-only.
 */
"use client";

import { useState } from "react";
import { updateProjectBasics } from "@/app/ops/actions";

interface ProjectNameEditorProps {
  projectId: string;
  currentName: string;
  currentClientName?: string;
}

/**
 * Project name editor component.
 * 
 * Provides inline editing for project name and client name.
 * Uses server action updateProjectBasics for updates.
 */
export function ProjectNameEditor({
  projectId,
  currentName,
  currentClientName,
}: ProjectNameEditorProps) {
  const [name, setName] = useState(currentName);
  const [clientName, setClientName] = useState(currentClientName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateProjectBasics({
      projectId,
      name,
      clientName: clientName.trim() || null,
    });

    if (result.ok) {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to update project");
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setName(currentName);
    setClientName(currentClientName || "");
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Project Name
          </label>
          <div className="text-sm text-zinc-900 dark:text-zinc-50">{name}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Client Name
          </label>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {clientName || "—"}
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200">
            Project updated successfully
          </p>
        </div>
      )}
      <div>
        <label
          htmlFor="project-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Project Name *
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="client-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Client Name
        </label>
        <input
          id="client-name"
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
