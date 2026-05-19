import { searchApprovalHook } from "@/workflows/hooks/search-approval";

export async function POST(request: Request) {
  const { toolCallId, approved, comment } = await request.json();
  await searchApprovalHook.resume(toolCallId, {
    approved,
    comment,
  });
  return Response.json({ success: true });
}
