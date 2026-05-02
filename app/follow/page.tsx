import { redirect } from "next/navigation";
import { sql, DEMO_CREATOR_ID, type Creator } from "@/lib/db";
import { FollowManager } from "@/components/follow-manager";

export const dynamic = "force-dynamic";

export default async function FollowPage() {
  const creators = (await sql`
    SELECT id, onboarded FROM creators WHERE id = ${DEMO_CREATOR_ID} LIMIT 1
  `) as Pick<Creator, "id" | "onboarded">[];
  if (!creators[0]?.onboarded) redirect("/onboarding");

  return <FollowManager />;
}
