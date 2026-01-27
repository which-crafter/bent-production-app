/**
 * Projects page (/projects) - Project list view.
 * 
 * Module 2 — Portion C: Project List Page
 * 
 * Fetches all projects from Supabase, ordered by project_code ASC,
 * and displays them in a table with lifecycle state filtering.
 */
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow, Project } from "@/app/ops/types";
import { ProjectsTable } from "./_components/ProjectsTable";

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
 * Projects page component.
 * 
 * Fetches projects from Supabase (ordered by project_code ASC),
 * transforms data, and renders the projects list interface.
 */
export default async function ProjectsPage() {
  // Fetch projects ordered by project_code ascending
  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, project_code, name, client_name, lifecycle_state")
    .order("project_code", { ascending: true });

  // Transform database rows to display format (snake_case → camelCase)
  const projects: Project[] = projectsData
    ? projectsData.map(transformProjectRow)
    : [];

  // Check for errors
  const hasError = !!projectsError;
  const errorMessage = projectsError?.message;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Projects
      </h1>

      {/* Error State */}
      {hasError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Error loading data: {errorMessage}
          </p>
        </div>
      )}

      {/* Projects Table Section */}
      <section>
        <ProjectsTable projects={projects} />
      </section>
    </div>
  );
}
