import { z } from "zod";
import { contactAgentHook } from "@/workflows/hooks/contact-agent";

const schema = z.object({
  toolCallId: z.string(),
  approved: z.boolean(),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await contactAgentHook.resume(parsed.data.toolCallId, {
      approved: parsed.data.approved,
      message: parsed.data.message,
    });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
