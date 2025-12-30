import { supabase } from "@/lib/supabaseClient";
import type { Lead, Project, LeadRow, ProjectRow, LeadStatus, ProjectStatus } from "./types";
import { LeadsTable } from "./_components/LeadsTable";

function getStatusColor(status: LeadStatus | ProjectStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "contacted":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "qualified":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "lost":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "on_hold":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "closed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

function formatStatus(status: LeadStatus | ProjectStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function transformLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    companyOrClient: row.company_or_client,
    status: row.status,
    source: row.source || undefined,
    updatedAt: row.updated_at,
  };
}

function transformProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    projectCode: row.project_code,
    name: row.name,
    clientName: row.client_name || undefined,
    status: row.status,
    leadId: row.lead_id,
  };
}

export default async function OpsPage() {
  // Fetch leads
  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("id, name, company_or_client, status, source, updated_at");

  // Fetch projects
  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, lead_id, project_code, name, client_name, status");

  // Transform database rows to display format
  const leads: Lead[] = leadsData ? leadsData.map(transformLeadRow) : [];
  const projects: Project[] = projectsData
    ? projectsData.map(transformProjectRow)
    : [];

  // Check for errors
  const hasError = leadsError || projectsError;
  const errorMessage = leadsError?.message || projectsError?.message;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
          Operations
        </h1>

        {/* Error State */}
        {hasError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error loading data: {errorMessage}
            </p>
          </div>
        )}

        {/* Leads Section */}
        <section>
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Leads
          </h2>
          <LeadsTable leads={leads} projects={projects} />
        </section>

        {/* Projects Section */}
        <section>
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Projects
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
                No projects found
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Lead ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {projects.map((project: Project) => (
                      <tr
                        id={`project-${project.id}`}
                        key={project.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-black dark:text-zinc-50">
                          {project.projectCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                          {project.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {project.clientName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {formatStatus(project.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-600 dark:text-zinc-400">
                          {project.leadId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

