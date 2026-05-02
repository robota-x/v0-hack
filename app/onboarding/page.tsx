import { redirect } from "next/navigation";
import { getSql, DEMO_CREATOR_ID, type Creator } from "@/lib/db";
import { OnboardingFlow } from "@/components/onboarding-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const sql = getSql();
  const creators = (await sql`
    SELECT id, name, niche, interests, style, onboarded, created_at, updated_at
    FROM creators
    WHERE id = ${DEMO_CREATOR_ID}
    LIMIT 1
  `) as Creator[];

  if (creators[0]?.onboarded) {
    redirect("/");
  }

  return <OnboardingFlow initial={creators[0]} />;
}
