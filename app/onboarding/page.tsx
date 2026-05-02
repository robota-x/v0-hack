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

  const accounts = (await sql`
    SELECT username
    FROM follow_accounts
    WHERE creator_id = ${DEMO_CREATOR_ID}
    ORDER BY created_at ASC
  `) as { username: string }[];

  const hashtags = (await sql`
    SELECT tag
    FROM follow_hashtags
    WHERE creator_id = ${DEMO_CREATOR_ID}
    ORDER BY created_at ASC
  `) as { tag: string }[];

  return (
    <OnboardingFlow
      initial={creators[0]}
      initialAccounts={accounts.map((a) => a.username)}
      initialHashtags={hashtags.map((h) => h.tag)}
    />
  );
}
