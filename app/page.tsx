import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user?.id ? await db.user.findUnique({ where: { id: session.user.id } }) : null;
  const hasLocation = !!(user?.location as Record<string, unknown> | null)?.lat;
  const hasConditions = Array.isArray(user?.conditions) && (user.conditions as unknown[]).length > 0;

  if (!hasLocation && !hasConditions) redirect("/onboarding");
  redirect("/dashboard");
}
