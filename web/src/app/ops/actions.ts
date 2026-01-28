/**
 * Server actions for lead and project operations.
 * 
 * All mutations use Next.js Server Actions (no API routes).
 * On success, revalidates /ops cache and redirects to refresh data.
 */
"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "./types";

/**
 * Converts a qualified lead into a project.
 * 
 * Calls database RPC function which:
 * - Validates lead exists and status is 'qualified'
 * - Generates project_code (format NNNN-YY)
 * - Creates project with status 'active'
 * - Sets lead status to 'qualified' (defensive)
 * 
 * @param leadId - UUID of the lead to convert
 * @param projectName - Required project name
 * @param clientName - Optional client name
 * @returns Error object on failure, redirects on success
 */
export async function convertLeadToProject(
  leadId: string,
  projectName: string,
  clientName: string | null
) {
  const { error } = await supabase.rpc("convert_lead_to_project", {
    p_lead_id: leadId,
    p_project_name: projectName,
    p_client_name: clientName || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/ops");
  redirect("/ops");
}

/**
 * Creates a new lead in the database.
 * 
 * @param name - Required lead name
 * @param status - Lead status (must be valid LeadStatus)
 * @param companyOrClient - Optional company/client name
 * @param source - Optional lead source
 * @param notes - Optional notes
 * @returns Error object on failure, redirects on success
 */
export async function createLead(
  name: string,
  status: LeadStatus,
  companyOrClient: string | null,
  source: string | null,
  notes: string | null
) {
  const { error } = await supabase.from("leads").insert({
    name,
    status,
    company_or_client: companyOrClient || null,
    source: source || null,
    notes: notes || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/ops");
  redirect("/ops");
}

/**
 * Updates a lead's status.
 * 
 * Used for inline status editing with auto-save.
 * Database trigger automatically updates updated_at timestamp.
 * 
 * @param leadId - UUID of the lead to update
 * @param status - New status value
 * @returns Success/error object (does not redirect, allows inline UI updates)
 */
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/ops");
  return {
    success: true,
  };
}

/**
 * Logs a contact event for a lead (append-only).
 * 
 * Updates last_contacted_at to current timestamp and prepends a new
 * timestamped entry to last_contact_note. Format: "YYYY-MM-DD HH:mm — <note>"
 * 
 * Note: This is append-only - new entries are prepended, preserving history.
 * 
 * @param leadId - UUID of the lead
 * @param note - Required contact note (validated in UI before calling)
 * @param currentNote - Existing note content (null if first contact)
 * @returns Success/error object (does not redirect, allows inline UI updates)
 */
export async function logContact(leadId: string, note: string, currentNote: string | null) {
  // Format timestamp: YYYY-MM-DD HH:mm
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}`;
  
  // Prepend new timestamped line to existing note (append-only pattern)
  const newLine = `${timestamp} — ${note}`;
  const updatedNote = currentNote ? `${newLine}\n${currentNote}` : newLine;

  const { error } = await supabase
    .from("leads")
    .update({
      last_contacted_at: now.toISOString(),
      last_contact_note: updatedNote,
    })
    .eq("id", leadId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/ops");
  return {
    success: true,
  };
}

/**
 * Creates a new lead with a primary contact (Module 1 — Portion A).
 * 
 * This action enforces that every lead must have an associated primary contact,
 * which is a core requirement for Module 1. It replaces the simpler createLead()
 * function as the enforced lead creation path.
 * 
 * CURRENT STATE (Step B1):
 * - Validates all required fields server-side
 * - Creates lead record in leads table
 * - Creates contact record in contacts table (display_name combines first_name + last_name)
 * - Creates contact_links record linking lead to contact with relationship 'primary'
 * - Handles errors explicitly at each step
 * - Revalidates /leads and /ops paths on success
 * - Does NOT yet implement duplicate detection (deferred to future step)
 * 
 * @param input - Object containing lead data and primary contact data
 * @param input.lead - Lead information (name required, other fields optional)
 * @param input.primaryContact - Primary contact information (firstName, clientType required; email or phone required)
 * @returns Success/error object (no redirect, allows UI to handle response)
 * @throws Error if validation fails (with user-friendly message)
 */
export async function createLeadWithPrimaryContact(input: {
  lead: {
    name: string;
    status: LeadStatus;
    companyOrClient?: string | null;
    source?: string | null;
    notes?: string | null;
  };
  primaryContact: {
    firstName: string;
    clientType: string;
    email?: string | null;
    phone?: string | null;
    lastName?: string | null;
    company?: string | null;
    title?: string | null;
    city?: string | null;
    fullAddress?: string | null;
    notes?: string | null;
  };
}) {
  // Validation: lead.name is required
  if (!input.lead.name || !input.lead.name.trim()) {
    throw new Error("Lead name is required");
  }

  // Validation: primaryContact.firstName is required
  if (!input.primaryContact.firstName || !input.primaryContact.firstName.trim()) {
    throw new Error("Primary contact first name is required");
  }

  // Validation: primaryContact.clientType is required
  if (!input.primaryContact.clientType || !input.primaryContact.clientType.trim()) {
    throw new Error("Primary contact client type is required");
  }

  // Validation: at least one of email or phone must be present
  const hasEmail = input.primaryContact.email && input.primaryContact.email.trim();
  const hasPhone = input.primaryContact.phone && input.primaryContact.phone.trim();
  if (!hasEmail && !hasPhone) {
    throw new Error("Primary contact must have either an email address or phone number");
  }

  // Step 1: Create lead record
  const { data: leadData, error: leadError } = await supabase
    .from("leads")
    .insert({
      name: input.lead.name.trim(),
      status: input.lead.status || "new",
      company_or_client: input.lead.companyOrClient?.trim() || null,
      source: input.lead.source?.trim() || null,
      notes: input.lead.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (leadError) {
    return {
      success: false,
      error: `Failed to create lead: ${leadError.message}`,
    };
  }

  if (!leadData || !leadData.id) {
    return {
      success: false,
      error: "Failed to create lead: No lead ID returned",
    };
  }

  // Step 2: Create contact record
  // Combine first_name + last_name for display_name
  const displayName = input.primaryContact.lastName?.trim()
    ? `${input.primaryContact.firstName.trim()} ${input.primaryContact.lastName.trim()}`
    : input.primaryContact.firstName.trim();

  const { data: contactData, error: contactError } = await supabase
    .from("contacts")
    .insert({
      display_name: displayName,
      client_type: input.primaryContact.clientType.trim(),
      email: input.primaryContact.email?.trim() || null,
      phone: input.primaryContact.phone?.trim() || null,
      company: input.primaryContact.company?.trim() || null,
      role: input.primaryContact.title?.trim() || null,
      notes: input.primaryContact.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (contactError) {
    return {
      success: false,
      error: `Failed to create contact: ${contactError.message}`,
    };
  }

  if (!contactData || !contactData.id) {
    return {
      success: false,
      error: "Failed to create contact: No contact ID returned",
    };
  }

  // Step 3: Create contact_links record
  const { error: linkError } = await supabase.from("contact_links").insert({
    contact_id: contactData.id,
    lead_id: leadData.id,
    relationship: "primary",
  });

  if (linkError) {
    return {
      success: false,
      error: `Failed to link contact to lead: ${linkError.message}`,
    };
  }

  // Revalidate paths
  revalidatePath("/leads");
  revalidatePath("/ops");

  return {
    success: true,
  };
}

/**
 * Lifecycle state type for projects.
 */
type LifecycleState = 'quote' | 'awarded' | 'released' | 'active' | 'closed' | 'hold';

/**
 * Helper: Get the next state in the forward chain.
 * Forward chain: quote -> awarded -> released -> active -> closed
 */
function getNextState(currentState: LifecycleState): LifecycleState | null {
  const forwardChain: Record<LifecycleState, LifecycleState | null> = {
    quote: 'awarded',
    awarded: 'released',
    released: 'active',
    active: 'closed',
    closed: null, // closed is terminal
    hold: null, // hold is special, not in forward chain
  };
  return forwardChain[currentState] || null;
}

/**
 * Updates a project's lifecycle_state with enforced transition rules (Module 2 — Portion B).
 * 
 * LIFECYCLE RULES:
 * - Forward chain: quote -> awarded -> released -> active -> closed
 * - Hold semantics: any state -> hold (saves prev_lifecycle_state)
 * - Override rule: any non-forward transition requires override=true and override_reason
 * 
 * @param input - Transition parameters
 * @param input.projectId - Required project UUID
 * @param input.targetState - Target lifecycle state
 * @param input.override - If true, allows non-forward transitions (requires overrideReason)
 * @param input.overrideReason - Required if override=true (min 5 chars after trim)
 * @param input.holdReason - Optional reason when entering hold state
 * @returns Success/error object (no redirect, allows inline UI updates)
 */
export async function updateProjectLifecycleState(input: {
  projectId: string;
  targetState: LifecycleState;
  override?: boolean;
  overrideReason?: string;
  holdReason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Validation: projectId required
  if (!input.projectId || !input.projectId.trim()) {
    return { ok: false, error: 'Project ID is required' };
  }

  // Validation: targetState required
  if (!input.targetState) {
    return { ok: false, error: 'Target state is required' };
  }

  // Validation: If override=true => override_reason required (non-empty after trim)
  if (input.override === true) {
    const trimmedReason = input.overrideReason?.trim() || '';
    if (!trimmedReason) {
      return { ok: false, error: 'Override reason is required' };
    }
  }

  // Fetch current project state
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('lifecycle_state, prev_lifecycle_state')
    .eq('id', input.projectId)
    .single();

  if (fetchError) {
    return { ok: false, error: `Failed to fetch project: ${fetchError.message}` };
  }

  if (!project) {
    return { ok: false, error: 'Project not found' };
  }

  const currentState = project.lifecycle_state as LifecycleState;
  const prevState = project.prev_lifecycle_state as LifecycleState | null;

  // Validation: If entering hold (targetState='hold') and override=false: allowed from any non-hold state
  if (input.targetState === 'hold' && input.override !== true) {
    if (currentState === 'hold') {
      return { ok: false, error: 'Project is already on hold' };
    }
    // Allowed transition: any non-hold state -> hold
  }
  // Validation: If current state is hold and override=false: only targetState == prev_lifecycle_state allowed
  else if (currentState === 'hold' && input.override !== true) {
    if (!prevState) {
      return { ok: false, error: 'Cannot resume from hold: previous state is missing' };
    }
    if (input.targetState !== prevState) {
      return { ok: false, error: `When resuming from hold, target state must be ${prevState}` };
    }
  }
  // Validation: If override=false and current state != hold and targetState != hold:
  // targetState must be exactly the next state in the forward chain
  else if (input.override !== true && currentState !== 'hold' && input.targetState !== 'hold') {
    const nextState = getNextState(currentState);
    if (input.targetState !== nextState) {
      return { ok: false, error: `Invalid transition: ${currentState} -> ${input.targetState}. Expected: ${nextState || 'none (terminal state)'}` };
    }
  }

  // Build update object
  const now = new Date().toISOString();
  const updateData: Partial<{
    lifecycle_state: string;
    prev_lifecycle_state: string | null;
    hold_reason: string | null;
    hold_at: string;
    lifecycle_override_reason: string;
  }> = {};

  // Handle entering hold state
  if (input.targetState === 'hold') {
    updateData.lifecycle_state = 'hold';
    // Only set prev_lifecycle_state if not already in hold (preserve existing prev on re-hold)
    if (currentState !== 'hold') {
      updateData.prev_lifecycle_state = currentState;
    }
    updateData.hold_at = now;
    // Set hold_reason if provided (can be null)
    if (input.holdReason !== undefined) {
      updateData.hold_reason = input.holdReason?.trim() || null;
    }
  }
  // Handle resuming from hold (targetState == prev_lifecycle_state)
  else if (currentState === 'hold' && input.targetState === prevState) {
    updateData.lifecycle_state = input.targetState;
    // Do NOT clear hold_reason or hold_at (keep history)
    // Do NOT change prev_lifecycle_state on resume (leave it as the last pre-hold state)
  }
  // Handle regular state transitions
  else {
    updateData.lifecycle_state = input.targetState;
  }

  // Handle override: write lifecycle_override_reason
  if (input.override === true) {
    updateData.lifecycle_override_reason = input.overrideReason?.trim() || '';
  }

  // Perform update
  const { error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', input.projectId);

  if (updateError) {
    return { ok: false, error: `Failed to update project: ${updateError.message}` };
  }

  // Revalidate paths
  revalidatePath('/projects');
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath('/ops');

  return { ok: true };
}

/**
 * Updates a project's name and client_name (Module 2 scope).
 * 
 * @param input - Update parameters
 * @param input.projectId - Required project UUID
 * @param input.name - Required project name
 * @param input.clientName - Optional client name (can be null to clear)
 * @returns Success/error object (no redirect, allows inline UI updates)
 */
export async function updateProjectBasics(input: {
  projectId: string;
  name: string;
  clientName?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  // Validation: projectId required
  if (!input.projectId || !input.projectId.trim()) {
    return { ok: false, error: 'Project ID is required' };
  }

  // Validation: name required
  if (!input.name || !input.name.trim()) {
    return { ok: false, error: 'Project name is required' };
  }

  // Build update object
  const updateData: Partial<{
    name: string;
    client_name: string | null;
  }> = {
    name: input.name.trim(),
  };

  // Handle clientName (can be null to clear)
  if (input.clientName !== undefined) {
    updateData.client_name = input.clientName?.trim() || null;
  }

  // Perform update
  const { error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', input.projectId);

  if (updateError) {
    return { ok: false, error: `Failed to update project: ${updateError.message}` };
  }

  // Revalidate paths
  revalidatePath('/projects');
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath('/ops');

  return { ok: true };
}

