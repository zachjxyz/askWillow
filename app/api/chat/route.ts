import {
  UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  createAgentUIStreamResponse,
} from "ai";
import { start } from "workflow/api";
import { chatWorkflow } from "@/workflows/chat/workflows";
import { searchAgent } from "@/lib/agents/search-agent";

export async function POST(req: Request) {
  const {
    messages,
    personaId,
    durable,
  }: { messages: UIMessage[]; personaId?: string; durable?: boolean } =
    await req.json();

  if (durable) {
    const modelMessages = await convertToModelMessages(messages);
    const run = await start(chatWorkflow, [modelMessages, personaId]);
    return createUIMessageStreamResponse({ stream: run.readable });
  }

  return createAgentUIStreamResponse({
    agent: searchAgent,
    uiMessages: messages,
    options: { personaId },
  });
}
