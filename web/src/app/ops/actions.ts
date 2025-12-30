"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "./types";

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

export async function logContact(leadId: string, note: string, currentNote: string | null) {
  // Format timestamp: YYYY-MM-DD HH:mm
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}`;
  
  // Prepend new timestamped line to existing note
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

