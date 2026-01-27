/**
 * Type definitions for leads and projects.
 * 
 * Separates database schema types (snake_case) from UI display types (camelCase).
 * This allows type-safe transformation between database rows and UI components.
 */

/** Lead status values matching database CHECK constraint */
export type LeadStatus = "new" | "contacted" | "qualified" | "lost";

/** Project status values matching database CHECK constraint */
export type ProjectStatus = "active" | "on_hold" | "closed";

/** Project lifecycle state values matching database CHECK constraint (Module 2) */
export type LifecycleState = "quote" | "awarded" | "released" | "active" | "closed" | "hold";

/**
 * Database schema type for leads table (snake_case).
 * Matches the exact column names returned from Supabase queries.
 */
export interface LeadRow {
  id: string;
  name: string;
  company_or_client: string;
  status: LeadStatus;
  source: string | null;
  updated_at: string;
  last_contacted_at: string | null;
  last_contact_note: string | null;
}

/**
 * Database schema type for projects table (snake_case).
 * Matches the exact column names returned from Supabase queries.
 */
export interface ProjectRow {
  id: string;
  lead_id: string;
  project_code: string;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
  lifecycle_state: LifecycleState;
}

/**
 * Display type for leads (camelCase) used in UI components.
 * Transformed from LeadRow to match React/TypeScript conventions.
 * Nullable database fields become optional (undefined) for cleaner UI code.
 */
export interface Lead {
  id: string;
  name: string;
  companyOrClient: string;
  status: LeadStatus;
  source?: string;
  updatedAt: string;
  lastContactedAt?: string;
  lastContactNote?: string;
}

/**
 * Display type for projects (camelCase) used in UI components.
 * Transformed from ProjectRow to match React/TypeScript conventions.
 */
export interface Project {
  id: string;
  projectCode: string;
  name: string;
  clientName?: string;
  status: ProjectStatus;
  leadId: string;
  lifecycleState: LifecycleState;
}

