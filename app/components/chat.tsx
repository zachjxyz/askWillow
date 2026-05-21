"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { SearchApprovalCard } from "./search-approval-card";
import { ContactAgentCard } from "./contact-agent-card";

type Persona = {
  uuid: string;
  role: "buyer" | "renter";
  name: string;
  income: number;
  budget: number;
  hasKids: boolean | null;
  hasPets: boolean | null;
  petType: "dog" | "cat" | "all" | null;
  preferredCity: string[] | null;
  preferredState: string[] | null;
};

export function ChatApp({ personas }: { personas: Persona[] }) {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [input, setInput] = useState("");
  const { messages, sendMessage, addToolApprovalResponse, status } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // --- Persona Selection Screen ---
  if (!selectedPersona) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 font-sans dark:bg-zinc-950">
        <div className="w-full max-w-5xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg
                className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              askWillow
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Choose a persona to get started
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {personas.map((persona) => (
              <button
                key={persona.uuid}
                onClick={() => setSelectedPersona(persona)}
                className="group cursor-pointer rounded-2xl border border-zinc-200 bg-white px-7 py-6 text-left transition-all hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {persona.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                      persona.role === "buyer"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {persona.role}
                  </span>
                </div>
                <ul className="mt-4 space-y-1.5">
                  <li className="text-sm text-zinc-600 dark:text-zinc-400">
                    Budget:{" "}
                    {persona.role === "buyer"
                      ? `$${persona.budget.toLocaleString()}`
                      : `$${persona.budget.toLocaleString()}/mo`}
                  </li>
                  <li className="text-sm text-zinc-600 dark:text-zinc-400">
                    Income: ${persona.income.toLocaleString()}/yr
                  </li>
                  {persona.hasPets && (
                    <li className="text-sm text-zinc-600 dark:text-zinc-400">
                      Pet: {persona.petType}
                    </li>
                  )}
                  {persona.hasKids && (
                    <li className="text-sm text-zinc-600 dark:text-zinc-400">
                      Has kids
                    </li>
                  )}
                  {persona.preferredCity && (
                    <li className="text-sm text-zinc-600 dark:text-zinc-400">
                      Cities: {persona.preferredCity.join(", ")}
                    </li>
                  )}
                </ul>
              </button>
            ))}

            {/* Greyed-out "Build Your Own" card */}
            <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 px-7 py-6 opacity-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="mb-2">
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Build Your Own
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Tell the agent about yourself and let it learn your preferences
                conversationally.
              </p>
              <div className="absolute inset-0 flex items-end justify-center rounded-2xl pb-4">
                <span className="rounded-full bg-zinc-200 px-3 py-1 text-[10px] font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                  Coming soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Chat Interface ---
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-zinc-950 font-sans">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {selectedPersona.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                selectedPersona.role === "buyer"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {selectedPersona.role}
            </span>
          </div>
          <button
            onClick={() => setSelectedPersona(null)}
            className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Switch persona
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-24">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Ask {selectedPersona.name.split(" ")[0]}&apos;s assistant
                anything about finding a home.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] space-y-2 ${
                  message.role === "user"
                    ? "rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-white"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Streamdown
                          key={`${message.id}-${i}`}
                          plugins={{ code }}
                          isAnimating={status === "streaming"}
                        >
                          {part.text}
                        </Streamdown>
                      );
                    case "tool-searchHomes":
                      if (part.state === "approval-requested") {
                        return (
                          <SearchApprovalCard
                            key={`${message.id}-${i}`}
                            input={part.input as Record<string, unknown>}
                            onRespond={(approved, reason) => {
                              addToolApprovalResponse({
                                id: part.approval.id,
                                approved,
                                reason,
                              });
                            }}
                          />
                        );
                      }
                      if (part.state === "output-available") {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                          >
                            <svg
                              className="h-3.5 w-3.5 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                              />
                            </svg>
                            <span>
                              Searched listings
                              {Array.isArray(part.output) && part.output.length > 0
                                ? ` — found ${part.output.length} result${part.output.length === 1 ? "" : "s"}`
                                : ""}
                            </span>
                          </div>
                        );
                      }
                      if (part.state === "output-denied") {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <span>Search rejected</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`${message.id}-${i}`}
                          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <span className="animate-pulse">Searching...</span>
                        </div>
                      );
                    case "tool-contactAgent":
                      if (part.state === "approval-requested") {
                        return (
                          <ContactAgentCard
                            key={`${message.id}-${i}`}
                            input={part.input as { address: string; price: string; listingType: "forSale" | "forRent" }}
                            onRespond={(approved, reason) => {
                              addToolApprovalResponse({
                                id: part.approval.id,
                                approved,
                                reason,
                              });
                            }}
                          />
                        );
                      }
                      if (part.state === "output-available") {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                          >
                            <span>Contact request submitted</span>
                          </div>
                        );
                      }
                      if (part.state === "output-denied") {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <span>Contact request cancelled</span>
                          </div>
                        );
                      }
                      return null;
                  }
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage(
              { text: input },
              { body: { personaId: selectedPersona.uuid } },
            );
            setInput("");
          }}
          className="mx-auto flex max-w-2xl items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Ask about homes..."
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
