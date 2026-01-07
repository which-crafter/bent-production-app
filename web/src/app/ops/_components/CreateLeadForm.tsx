"use client";

import { useState, useTransition } from "react";
import { createLeadWithPrimaryContact } from "../actions";

export function CreateLeadForm() {
  // Lead fields
  const [name, setName] = useState("");
  const [companyOrClient, setCompanyOrClient] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  // Primary contact fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientType, setClientType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (!name.trim()) {
      setError("Lead name is required");
      return;
    }

    if (!firstName.trim()) {
      setError("Primary contact first name is required");
      return;
    }

    if (!clientType.trim()) {
      setError("Primary contact client type is required");
      return;
    }

    if (!source.trim()) {
      setError("Source is required");
      return;
    }

    const hasEmail = email.trim();
    const hasPhone = phone.trim();
    if (!hasEmail && !hasPhone) {
      setError("Primary contact must have either an email address or phone number");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createLeadWithPrimaryContact({
          lead: {
            name: name.trim(),
            companyOrClient: companyOrClient.trim() || null,
            source: source.trim(),
            notes: notes.trim() || null,
          },
          primaryContact: {
            firstName: firstName.trim(),
            lastName: lastName.trim() || null,
            clientType: clientType.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            company: companyOrClient.trim() || null,
            notes: contactNotes.trim() || null,
          },
        });

        if (!result.success) {
          setError(result.error || "Failed to create lead");
        } else {
          // Clear form on success
          setName("");
          setCompanyOrClient("");
          setSource("");
          setNotes("");
          setFirstName("");
          setLastName("");
          setClientType("");
          setEmail("");
          setPhone("");
          setContactNotes("");
          setSuccess(true);
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(false), 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create lead");
      }
    });
  }

  const isFormValid = name.trim() && firstName.trim() && clientType.trim() && source.trim() && (email.trim() || phone.trim());

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
        Create Lead
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lead Information Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Lead Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="lead-name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Lead Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lead-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="e.g., Ken — Cabinet quote — Glendale"
              />
            </div>

            <div>
              <label
                htmlFor="company-client"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Company/Client
              </label>
              <input
                id="company-client"
                type="text"
                value={companyOrClient}
                onChange={(e) => setCompanyOrClient(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter company or client name"
              />
            </div>

            <div>
              <label
                htmlFor="lead-source"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Source <span className="text-red-500">*</span>
              </label>
              <input
                id="lead-source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter source"
              />
            </div>

            <div>
              <label
                htmlFor="lead-notes"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Notes
              </label>
              <textarea
                id="lead-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-y"
                placeholder="Enter notes"
              />
            </div>
          </div>
        </div>

        {/* Primary Contact Section */}
        <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Primary Contact
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first-name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label
                htmlFor="last-name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Last Name
              </label>
              <input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label
                htmlFor="client-type"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Client Type <span className="text-red-500">*</span>
              </label>
              <select
                id="client-type"
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
                required
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select client type</option>
                <option value="homeowner">Homeowner</option>
                <option value="designer">Designer</option>
                <option value="contractor">Contractor</option>
                <option value="dealer">Dealer</option>
                <option value="architect">Architect</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter email address"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Email or Phone is required (at least one).
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter phone number"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Email or Phone is required (at least one).
              </p>
            </div>


            <div className="md:col-span-2">
              <label
                htmlFor="contact-notes"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Contact Notes
              </label>
              <textarea
                id="contact-notes"
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                disabled={isPending}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-y"
                placeholder="Enter contact notes"
              />
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              Lead created successfully!
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !isFormValid}
            className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

