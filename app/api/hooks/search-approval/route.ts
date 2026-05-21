import { z } from "zod";
import { searchApprovalHook } from "@/workflows/hooks/search-approval";

const schema = z.object({
  toolCallId: z.string(),
  approved: z.boolean(),
  comment: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await searchApprovalHook.resume(parsed.data.toolCallId, {
      approved: parsed.data.approved,
      comment: parsed.data.comment,
    });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
