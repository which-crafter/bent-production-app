/**
 * Project detail page (/projects/[id]) - Single project view.
 * 
 * Module 2 — Portion D: Project Detail Page
 * 
 * Fetches a single project from Supabase and displays full project information
 * with edit controls for name/client_name and lifecycle state management.
 */
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow, Project } from "@/app/ops/types";
import { notFound } from "next/navigation";
import { ProjectDetail } from "../_components/ProjectDetail";

/**
 * Transforms database project row (snake_case) to UI display format (camelCase).
 * Converts null values to undefined for cleaner optional handling in components.
 * 
 * @param row - Database row from Supabase query
 * @returns Project object for UI components
 */
function transformProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    projectCode: row.project_code,
    name: row.name,
    clientName: row.client_name || undefined,
    status: row.status,
    leadId: row.lead_id,
    lifecycleState: row.lifecycle_state,
  };
}

/**
 * Project detail page component.
 * 
 * Fetches a single project by ID from Supabase and renders the project detail interface.
 */
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch project by ID
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, project_code, name, client_name, lifecycle_state, prev_lifecycle_state, status, lead_id, start_date, end_date, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  // Handle not found
  if (projectError || !projectData) {
    notFound();
  }

  // Transform database row to display format
  const project = transformProjectRow(projectData);

  // Fetch additional fields needed for display
  const fullProject = {
    ...project,
    prevLifecycleState: (projectData.prev_lifecycle_state as Project["lifecycleState"]) || undefined,
    startDate: projectData.start_date || undefined,
    endDate: projectData.end_date || undefined,
    createdAt: projectData.created_at,
    updatedAt: projectData.updated_at,
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Project: {project.projectCode}
      </h1>

      <ProjectDetail project={fullProject} />
    </div>
  );
}
