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

