import Link from "next/link";

/**
 * Dashboard homepage.
 * 
 * Stub page for Module 1. Provides entry point to the app with
 * navigation to the Leads section. Future modules will add more
 * dashboard functionality.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Dashboard
      </h1>

      <div className="space-y-4">
        <p className="text-lg text-zinc-700 dark:text-zinc-300 max-w-2xl">
          Module 1 provides lead intake and management. Create leads, track their status,
          log contact events, and convert qualified leads into projects.
        </p>

        <div>
          <Link
            href="/leads"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
          >
            Go to Leads
          </Link>
        </div>
      </div>
    </div>
  );
}

