import { redirect } from "next/navigation";
import { getSql, DEMO_CREATOR_ID, type Creator, type Snapshot } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sql = getSql();
  const creators = (await sql`
    SELECT id, name, niche, interests, style, onboarded, created_at, updated_at
    FROM creators
    WHERE id = ${DEMO_CREATOR_ID}
    LIMIT 1
  `) as Creator[];

  const creator = creators[0];
  if (!creator || !creator.onboarded) {
    redirect("/onboarding");
  }

  const snapshots = (await sql`
    SELECT id, creator_id, themes, summary, created_at
    FROM snapshots
    WHERE creator_id = ${DEMO_CREATOR_ID}
    ORDER BY created_at DESC
    LIMIT 1
  `) as Snapshot[];

  return <Dashboard creator={creator} snapshot={snapshots[0] ?? null} />;
}
