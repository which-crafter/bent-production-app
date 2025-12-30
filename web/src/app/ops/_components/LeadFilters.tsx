"use client";

interface LeadFiltersProps {
  showStale: boolean;
  showConverted: boolean;
  showLost: boolean;
  onShowStaleChange: (value: boolean) => void;
  onShowConvertedChange: (value: boolean) => void;
  onShowLostChange: (value: boolean) => void;
}

export function LeadFilters({
  showStale,
  showConverted,
  showLost,
  onShowStaleChange,
  onShowConvertedChange,
  onShowLostChange,
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
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          checked={showLost}
          onChange={(e) => onShowLostChange(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
        />
        <span>Show lost</span>
      </label>
    </div>
  );
}

