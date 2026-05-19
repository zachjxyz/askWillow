import { db } from "@/db";
import { personasTable } from "@/db/schema";
import { ChatApp } from "./components/chat";

export default async function Home() {
  const personas = await db.select().from(personasTable);

  return <ChatApp personas={personas} />;
}
