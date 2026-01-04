/**
 * Leads page (/leads) - Primary user surface for lead management.
 * 
 * This page reuses components from /ops/_components without refactoring them.
 * This is intentional for Module 1E (Portion E): we're building the app shell
 * and navigation structure first, then will consolidate/refactor components
 * in a future step. For now, we reuse existing components as-is to avoid
 * scope creep during the shell implementation phase.
 */
import { supabase } from "@/lib/supabaseClient";
import type { Lead, Project, LeadRow, ProjectRow } from "@/app/ops/types";
import { CreateLeadForm } from "@/app/ops/_components/CreateLeadForm";
import { LeadsTable } from "@/app/ops/_components/LeadsTable";

/**
 * Transforms database lead row (snake_case) to UI display format (camelCase).
 * Converts null values to undefined for cleaner optional handling in components.
 * 
 * @param row - Database row from Supabase query
 * @returns Lead object for UI components
 */
function transformLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    companyOrClient: row.company_or_client,
    status: row.status,
    source: row.source || undefined,
    updatedAt: row.updated_at,
    lastContactedAt: row.last_contacted_at || undefined,
    lastContactNote: row.last_contact_note || undefined,
  };
}

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
  };
}

/**
 * Leads page component.
 * 
 * Fetches leads (ordered by created_at desc) and projects from Supabase,
 * transforms data, and renders the leads management interface.
 */
export default async function LeadsPage() {
  // Fetch leads ordered by created_at descending (newest first)
  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("id, name, company_or_client, status, source, updated_at, last_contacted_at, last_contact_note")
    .order("created_at", { ascending: false });

  // Fetch projects needed for LeadsTable to determine converted leads
  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, lead_id, project_code, name, client_name, status");

  // Transform database rows to display format (snake_case → camelCase)
  const leads: Lead[] = leadsData ? leadsData.map(transformLeadRow) : [];
  const projects: Project[] = projectsData
    ? projectsData.map(transformProjectRow)
    : [];

  // Check for errors
  const hasError = leadsError || projectsError;
  const errorMessage = leadsError?.message || projectsError?.message;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Leads
      </h1>

      {/* Error State */}
      {hasError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Error loading data: {errorMessage}
          </p>
        </div>
      )}

      {/* Create Lead Section */}
      <section>
        <CreateLeadForm />
      </section>

      {/* Leads Table Section */}
      <section>
        <LeadsTable leads={leads} projects={projects} />
      </section>
    </div>
  );
}

