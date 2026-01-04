/**
 * App route group layout.
 * 
 * The (app) route group wraps routes that should share this layout structure
 * (header + tabs). Routes outside this group (like /ops) are excluded and
 * render with the root layout only.
 */
import { AppTabs } from "./_components/AppTabs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header with app title */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Bent Production App
          </h1>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-8">
          <AppTabs />
        </div>
      </nav>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}

