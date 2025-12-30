export type LeadStatus = "new" | "contacted" | "qualified" | "lost";
export type ProjectStatus = "active" | "on_hold" | "closed";

// Database schema types (snake_case)
export interface LeadRow {
  id: string;
  name: string;
  company_or_client: string;
  status: LeadStatus;
  source: string | null;
}

export interface ProjectRow {
  id: string;
  lead_id: string;
  project_code: string;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
}

// Display types (camelCase) for UI
export interface Lead {
  id: string;
  name: string;
  companyOrClient: string;
  status: LeadStatus;
  source?: string;
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  clientName?: string;
  status: ProjectStatus;
  leadId: string;
}

