import type { RankedTheme } from '@/lib/types';

function appBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

/**
 * Calls the dashboard refresh API to trigger cache revalidation
 * after a new snapshot is persisted. This ensures the website
 * displays the latest data without requiring a manual refresh.
 */
export async function updateWebsite(
  rankedThemes: RankedTheme[],
  creatorId: number
): Promise<{ success: boolean; error?: string }> {
  'use step';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.INTERNAL_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.INTERNAL_API_TOKEN}`;
  }

  try {
    const response = await fetch(`${appBaseUrl()}/api/dashboard/refresh`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log(`[updateWebsite] API error: ${errorData}`);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    console.log(
      `[updateWebsite] Dashboard refreshed for creatorId=${creatorId} with ${rankedThemes.length} themes at ${data.revalidatedAt}`
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[updateWebsite] Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}
