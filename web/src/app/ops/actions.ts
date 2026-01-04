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

