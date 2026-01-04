/**
 * App route group layout.
 * 
 * The (app) route group wraps routes that should share this layout structure
 * (header + tabs). Routes outside this group (like /ops) are excluded and
 * render with the root layout only.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Minimal header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Bent Production App
          </h1>
        </div>
      </header>

      {/* Placeholder for navigation tabs (to be implemented) */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-8">
          {/* Tabs will be added here in future implementation */}
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}

