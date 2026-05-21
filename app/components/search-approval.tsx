"use client";

import { useState } from "react";

interface SearchApprovalProps {
  toolCallId: string;
  input?: { summary: string };
  output?: string;
}

export function SearchApproval({ toolCallId, input, output }: SearchApprovalProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const resolved = decision ?? (output ? (output.startsWith("Search rejected") ? "rejected" : "approved") : null);

  if (resolved) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        resolved === "approved"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      }`}>
        <span>{resolved === "approved" ? "Search approved" : "Search rejected"}</span>
      </div>
    );
  }

  const handleSubmit = async (approved: boolean) => {
    setIsSubmitting(true);
    setDecision(approved ? "approved" : "rejected");
    try {
      const res = await fetch("/api/hooks/search-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolCallId, approved, comment: comment || undefined }),
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
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Approval needed</span>
      </div>

      {input?.summary && (
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Search: <span className="font-medium text-zinc-800 dark:text-zinc-200">{input.summary}</span>
        </p>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)..."
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
          {isSubmitting ? "Submitting..." : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
