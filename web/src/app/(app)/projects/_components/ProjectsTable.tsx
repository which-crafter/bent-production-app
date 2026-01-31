/**
 * Projects table component with lifecycle state filtering.
 * 
 * Module 2 — Portion C: Project List Page
 * 
 * Features:
 * - Client-side filtering by lifecycle_state
 * - Mobile-first responsive layout
 * - Displays: project_code, name, client_name, lifecycle_state
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, LifecycleState } from "@/app/ops/types";

interface ProjectsTableProps {
  projects: Project[];
}

/**
 * Projects table component with lifecycle state filtering.
 * 
 * Displays projects in a table with filtering by lifecycle_state.
 * Default filter: "All" (shows all projects).
 */
export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [selectedFilter, setSelectedFilter] = useState<LifecycleState | "all">("all");

  // Filter projects based on selected lifecycle state
  const filteredProjects =
    selectedFilter === "all"
      ? projects
      : projects.filter((project) => project.lifecycleState === selectedFilter);

  /**
   * Formats lifecycle state for display.
   * Capitalizes first letter for better readability.
   */
  function formatLifecycleState(state: LifecycleState): string {
    return state.charAt(0).toUpperCase() + state.slice(1);
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Filter by lifecycle state:
        </label>
        <div className="flex flex-wrap gap-2">
          {(["all", "quote", "awarded", "released", "active", "closed", "hold"] as const).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`
                  px-3 py-1 text-sm font-medium rounded transition-colors
                  ${
                    selectedFilter === filter
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }
                `}
              >
                {filter === "all" ? "All" : formatLifecycleState(filter)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
            {projects.length === 0
              ? "No projects found"
              : `No projects with lifecycle state "${selectedFilter === "all" ? "All" : formatLifecycleState(selectedFilter)}"`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Project Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Lifecycle State
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-black dark:text-zinc-50">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {project.projectCode}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {project.clientName || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {formatLifecycleState(project.lifecycleState)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
