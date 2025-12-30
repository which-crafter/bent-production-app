"use client";

import type { LeadStatus } from "../types";

interface LeadFiltersProps {
  showStale: boolean;
  showConverted: boolean;
  checkedStatuses: Set<LeadStatus>;
  onShowStaleChange: (value: boolean) => void;
  onShowConvertedChange: (value: boolean) => void;
  onStatusChange: (status: LeadStatus, checked: boolean) => void;
}

export function LeadFilters({
  showStale,
  showConverted,
  checkedStatuses,
  onShowStaleChange,
  onShowConvertedChange,
  onStatusChange,
}: LeadFiltersProps) {
  const statuses: LeadStatus[] = ["new", "contacted", "qualified", "lost"];

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      <div className="flex gap-2 items-center">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
          Status:
        </span>
        {statuses.map((status) => (
          <label
            key={status}
            className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={checkedStatuses.has(status)}
              onChange={(e) => onStatusChange(status, e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="capitalize">{status}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showStale}
            onChange={(e) => onShowStaleChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
          />
          <span>Show stale</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showConverted}
            onChange={(e) => onShowConvertedChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
          />
          <span>Show converted</span>
        </label>
      </div>
    </div>
  );
}

