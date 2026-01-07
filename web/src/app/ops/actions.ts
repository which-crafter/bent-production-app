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

