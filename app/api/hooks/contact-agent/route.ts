import { contactAgentHook } from "@/workflows/hooks/contact-agent";

export async function POST(request: Request) {
  const { toolCallId, approved, message } = await request.json();
  await contactAgentHook.resume(toolCallId, { approved, message });
  return Response.json({ success: true });
}
