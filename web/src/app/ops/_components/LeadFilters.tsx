"use client";

interface LeadFiltersProps {
  showStale: boolean;
  showConverted: boolean;
  onShowStaleChange: (value: boolean) => void;
  onShowConvertedChange: (value: boolean) => void;
}

export function LeadFilters({
  showStale,
  showConverted,
  onShowStaleChange,
  onShowConvertedChange,
}: LeadFiltersProps) {
  return (
    <div className="flex gap-4 mb-4">
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
  );
}

