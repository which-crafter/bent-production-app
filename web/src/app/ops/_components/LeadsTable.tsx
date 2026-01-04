/**
 * Leads table component with filtering and inline editing.
 * 
 * Handles:
 * - Status-based filtering (checkboxes)
 * - Stale/converted toggles
 * - Separate sections for converted vs unconverted leads
 * - Inline status editing
 * - Contact logging
 */
"use client";

import { useState } from "react";
import type { Lead, Project, LeadStatus } from "../types";
import { ConvertLeadForm } from "./ConvertLeadForm";
import { LeadFilters } from "./LeadFilters";
import { StatusSelect } from "./StatusSelect";
import { LogContact } from "./LogContact";

interface LeadsTableProps {
  leads: Lead[];
  projects: Project[];
}

/**
 * Determines if a lead is stale (not updated in last 30 days).
 * 
 * Used for filtering to prevent endless growth of visible leads.
 * 
 * @param updatedAt - ISO timestamp string from database
 * @returns true if lead hasn't been updated in 30+ days
 */
function isStale(updatedAt: string): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(updatedAt) < thirtyDaysAgo;
}

/**
 * Formats last contacted timestamp as relative time or date.
 * 
 * Returns human-readable relative time for recent contacts,
 * falls back to date format for older entries.
 * 
 * @param lastContactedAt - ISO timestamp string (optional)
 * @returns Formatted string: "just now", "2h ago", "yesterday", "3d ago", "2w ago", or date
 */
function formatLastContacted(lastContactedAt?: string): string {
  if (!lastContactedAt) {
    return "—";
  }

  const date = new Date(lastContactedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "just now" : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Leads table component with filtering and inline editing.
 * 
 * Features:
 * - Status filtering (checkboxes for new/contacted/qualified/lost)
 * - Stale lead filtering (30+ days since update)
 * - Converted lead separation (shows in separate section when enabled)
 * - Inline status editing with auto-save
 * - Contact logging per lead
 * 
 * Default view: Shows only new + contacted leads that are not stale and not converted.
 */
export function LeadsTable({ leads, projects }: LeadsTableProps) {
  const [showStale, setShowStale] = useState(false);
  const [showConverted, setShowConverted] = useState(false);
  // Default: new + contacted checked (active leads only)
  const [checkedStatuses, setCheckedStatuses] = useState<Set<LeadStatus>>(
    new Set(["new", "contacted"])
  );

  // Create a map of lead_id -> project for O(1) lookup when checking if lead is converted
  const leadToProjectMap = new Map<string, Project>();
  projects.forEach((project) => {
    leadToProjectMap.set(project.leadId, project);
  });

  /**
   * Handles status checkbox changes in filter UI.
   * 
   * @param status - Status value to toggle
   * @param checked - Whether checkbox is checked
   */
  function handleStatusChange(status: LeadStatus, checked: boolean) {
    setCheckedStatuses((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(status);
      } else {
        next.delete(status);
      }
      return next;
    });
  }

  // Separate converted and unconverted leads for different display sections
  const convertedLeads = leads.filter((lead) => leadToProjectMap.has(lead.id));
  const unconvertedLeads = leads.filter((lead) => !leadToProjectMap.has(lead.id));

  // Filter unconverted leads based on status checkboxes and stale toggle
  // Converted leads are handled separately and shown regardless of status when "Show converted" is enabled
  const filteredUnconvertedLeads = unconvertedLeads.filter((lead) => {
    const isLeadStale = isStale(lead.updatedAt);

    // Must have checked status
    if (!checkedStatuses.has(lead.status)) {
      return false;
    }

    // Apply stale filter: if not showing stale, exclude stale leads
    if (!showStale && isLeadStale) {
      return false;
    }

    // Passes all filters
    return true;
  });

  /**
   * Renders a single lead row in the table.
   * 
   * @param lead - Lead data to render
   * @param showProjectCode - If true, shows project code inline with lead name (for converted leads section)
   * @returns Table row JSX
   */
  function renderLeadRow(lead: Lead, showProjectCode: boolean = false) {
    const existingProject = leadToProjectMap.get(lead.id);
    const isLeadStale = isStale(lead.updatedAt);

    return (
      <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
          {lead.name}
          {showProjectCode && existingProject && (
            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
              → {existingProject.projectCode}
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
          {lead.companyOrClient}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <StatusSelect leadId={lead.id} currentStatus={lead.status} />
            {isLeadStale && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Stale
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
          {lead.source || "-"}
        </td>
        <td className="px-6 py-4">
          <div className="space-y-1">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Last contacted: {formatLastContacted(lead.lastContactedAt)}
            </div>
            {lead.lastContactNote && (
              // whitespace-pre-line preserves newlines in append-only contact log
              <div className="text-xs text-zinc-500 dark:text-zinc-500 italic whitespace-pre-line">
                {lead.lastContactNote}
              </div>
            )}
            <LogContact leadId={lead.id} currentNote={lead.lastContactNote} />
          </div>
        </td>
        <td className="px-6 py-4">
          {existingProject ? (
            // Lead already converted - show link to project (anchor link scrolls to project row)
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Converted →</span>
              <a
                href={`#project-${existingProject.id}`}
                className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
              >
                {existingProject.projectCode}
              </a>
            </div>
          ) : lead.status === "qualified" ? (
            // Qualified and not converted - show conversion form
            <ConvertLeadForm leadId={lead.id} />
          ) : (
            // Not qualified - show disabled button
            <button
              disabled
              className="px-3 py-1 text-xs font-medium rounded bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed"
            >
              Convert to Project
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <>
      <LeadFilters
        showStale={showStale}
        showConverted={showConverted}
        checkedStatuses={checkedStatuses}
        onShowStaleChange={setShowStale}
        onShowConvertedChange={setShowConverted}
        onStatusChange={handleStatusChange}
      />

      {/* Converted Leads Section */}
      {showConverted && convertedLeads.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
            Converted Leads
          </h3>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Company/Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {convertedLeads.map((lead) => renderLeadRow(lead, true))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unconverted Leads Section */}
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
          Unconverted Leads
        </h3>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {filteredUnconvertedLeads.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
              No leads found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Company/Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider min-w-[400px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredUnconvertedLeads.map((lead) => renderLeadRow(lead))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

