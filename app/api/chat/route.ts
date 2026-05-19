import {
  UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
} from "ai";
import { start } from "workflow/api";
import { chatWorkflow } from "@/workflows/chat/workflows";

export async function POST(req: Request) {
  const { messages, personaId }: { messages: UIMessage[]; personaId?: string } =
    await req.json();

  const modelMessages = await convertToModelMessages(messages);
  const run = await start(chatWorkflow, [modelMessages, personaId]);

  return createUIMessageStreamResponse({ stream: run.readable });
}
