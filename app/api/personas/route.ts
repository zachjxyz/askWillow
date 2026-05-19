import { db } from "@/db";
import { personasTable } from "@/db/schema";

export async function GET(req: Request) {
  try {
    const personas = await db.select().from(personasTable);
    return Response.json(personas);
  } catch {
    return Response.json(
      { error: "Failed to fetch personas" },
      { status: 500 },
    );
  }
}
