"use client";

import { useState } from "react";

interface ContactAgentProps {
  toolCallId: string;
  input?: { address: string; price: string; listingType: "forSale" | "forRent" };
  output?: string;
}

export function ContactAgent({ toolCallId, input, output }: ContactAgentProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const resolved = decision ?? (output ? (output.startsWith("Contact request cancelled") ? "rejected" : "approved") : null);

  if (resolved) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        resolved === "approved"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      }`}>
        <span>{resolved === "approved" ? "Contact request submitted" : "Contact request cancelled"}</span>
      </div>
    );
  }

  const handleSubmit = async (approved: boolean) => {
    setIsSubmitting(true);
    setDecision(approved ? "approved" : "rejected");
    try {
      const res = await fetch("/api/hooks/contact-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolCallId, approved, message: message || undefined }),
      });
      if (!res.ok) setDecision(null);
    } catch {
      setDecision(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Contact a real estate agent?</span>
      </div>

      {input && (
        <div className="mb-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{input.address}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{input.price}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              input.listingType === "forSale"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              {input.listingType === "forSale" ? "For Sale" : "For Rent"}
            </span>
          </div>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a note for the agent (optional)..."
        className="mb-3 w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500"
        rows={2}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
          className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Yes, contact agent"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {isSubmitting ? "Submitting..." : "No thanks"}
        </button>
      </div>
    </div>
  );
}
