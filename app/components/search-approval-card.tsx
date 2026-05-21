"use client";

import { useState } from "react";

interface SearchApprovalCardProps {
  input: Record<string, unknown>;
  onRespond: (approved: boolean, reason?: string) => void;
}

export function SearchApprovalCard({ input, onRespond }: SearchApprovalCardProps) {
  const [reason, setReason] = useState("");
  const [responded, setResponded] = useState<"approved" | "rejected" | null>(null);

  if (responded) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        responded === "approved"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      }`}>
        <span>{responded === "approved" ? "Search approved" : "Search rejected"}</span>
      </div>
    );
  }

  const summary = formatSearchSummary(input);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Approval needed</span>
      </div>

      {summary && (
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Search: <span className="font-medium text-zinc-800 dark:text-zinc-200">{summary}</span>
        </p>
      )}

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Add a comment (optional)..."
        className="mb-3 w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500"
        rows={2}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setResponded("approved");
            onRespond(true, reason || undefined);
          }}
          className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => {
            setResponded("rejected");
            onRespond(false, reason || undefined);
          }}
          className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function formatSearchSummary(input: Record<string, unknown>): string {
  const parts: string[] = [];
  if (input.city) parts.push(`in ${input.city}`);
  if (input.state) parts.push(input.city ? `, ${input.state}` : `in ${input.state}`);
  if (input.listingType === "forSale") parts.unshift("homes for sale");
  else if (input.listingType === "forRent") parts.unshift("rentals");
  else parts.unshift("homes");
  if (input.maxSalePrice) parts.push(`under $${Number(input.maxSalePrice).toLocaleString()}`);
  if (input.maxMonthlyRent) parts.push(`under $${Number(input.maxMonthlyRent).toLocaleString()}/mo`);
  if (input.minBedrooms) parts.push(`${input.minBedrooms}+ bed`);
  return parts.join(" ");
}
