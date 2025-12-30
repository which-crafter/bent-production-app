"use client";

import { useState } from "react";
import type { Lead, Project, LeadStatus } from "../types";
import { ConvertLeadForm } from "./ConvertLeadForm";
import { LeadFilters } from "./LeadFilters";
import { StatusSelect } from "./StatusSelect";

interface LeadsTableProps {
  leads: Lead[];
  projects: Project[];
}

function isStale(updatedAt: string): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(updatedAt) < thirtyDaysAgo;
}

export function LeadsTable({ leads, projects }: LeadsTableProps) {
  const [showStale, setShowStale] = useState(false);
  const [showConverted, setShowConverted] = useState(false);

  // Create a map of lead_id -> project for quick lookup
  const leadToProjectMap = new Map<string, Project>();
  projects.forEach((project) => {
    leadToProjectMap.set(project.leadId, project);
  });

  // Filter leads based on criteria
  const filteredLeads = leads.filter((lead) => {
    const isConverted = leadToProjectMap.has(lead.id);
    const isLeadStale = isStale(lead.updatedAt);
    const isActiveStatus = ["new", "contacted", "qualified"].includes(lead.status);

    // Default filter: active status, not converted, not stale
    const passesDefault = isActiveStatus && !isConverted && !isLeadStale;

    // If "Show stale" is checked, include all stale leads
    if (showStale && isLeadStale) {
      return true;
    }

    // If "Show converted" is checked, include all converted leads
    if (showConverted && isConverted) {
      return true;
    }

    // Otherwise, apply default filter
    return passesDefault;
  });

  return (
    <>
      <LeadFilters
        showStale={showStale}
        showConverted={showConverted}
        onShowStaleChange={setShowStale}
        onShowConvertedChange={setShowConverted}
      />
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filteredLeads.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider min-w-[400px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredLeads.map((lead) => {
                  const existingProject = leadToProjectMap.get(lead.id);
                  const isLeadStale = isStale(lead.updatedAt);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-zinc-50">
                        {lead.name}
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
                        {existingProject ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Converted →
                            </span>
                            <a
                              href={`#project-${existingProject.id}`}
                              className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {existingProject.projectCode}
                            </a>
                          </div>
                        ) : lead.status === "qualified" ? (
                          <ConvertLeadForm leadId={lead.id} />
                        ) : (
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

