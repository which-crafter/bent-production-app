/**
 * Project detail component - displays full project information.
 * 
 * Module 2 — Portion D: Project Detail Page
 * 
 * Displays all project fields (read-only except name/client_name),
 * includes edit controls and lifecycle change control.
 */
"use client";

import type { Project, LifecycleState } from "@/app/ops/types";
import { ProjectNameEditor } from "./ProjectNameEditor";
import { LifecycleChangeControl } from "./LifecycleChangeControl";

interface ProjectDetailProps {
  project: Project & {
    prevLifecycleState?: LifecycleState;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Project detail component.
 * 
 * Displays all project information with edit controls for name/client_name
 * and lifecycle state management.
 */
export function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <div className="space-y-6">
      {/* Project Information Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
          Project Information
        </h2>

        <div className="space-y-4">
          {/* Project Code - Read-only */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Project Code
            </label>
            <div className="text-sm font-mono text-zinc-900 dark:text-zinc-50">
              {project.projectCode}
            </div>
          </div>

          {/* Name - Editable */}
          <ProjectNameEditor
            projectId={project.id}
            currentName={project.name}
            currentClientName={project.clientName}
          />

          {/* Lifecycle State - Managed by LifecycleChangeControl */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Lifecycle State
            </label>
            <LifecycleChangeControl
              projectId={project.id}
              currentState={project.lifecycleState}
              prevLifecycleState={project.prevLifecycleState}
            />
          </div>

          {/* Status - Read-only (not repurposed in Module 2) */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Status
            </label>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {project.status}
            </div>
          </div>

          {/* Start Date - Read-only */}
          {project.startDate && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Start Date
              </label>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(project.startDate).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* End Date - Read-only */}
          {project.endDate && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                End Date
              </label>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(project.endDate).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Created At - Read-only */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Created At
            </label>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {new Date(project.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Updated At - Read-only */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Updated At
            </label>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {new Date(project.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
