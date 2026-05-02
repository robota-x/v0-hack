import { fetchCreatorData } from '@/steps/fetch-creator-data';
import { scrapeInstagram } from '@/steps/scrape-instagram';
import { distilThemes } from '@/steps/distil-themes';
import { rankAgainstProfile } from '@/steps/rank-themes';
import { persistSnapshot } from '@/steps/persist-snapshot';
import { sendPushNotification } from '@/steps/send-push';
import { sendTelegramNotification } from '@/steps/send-telegram';

export async function creatorWorkflow(input: { creatorId: string }) {
  'use workflow';

  const creatorData = await fetchCreatorData(input.creatorId);
  const rawData = await scrapeInstagram(creatorData.followList);
  const themes = await distilThemes(rawData);
  const ranked = await rankAgainstProfile(themes, creatorData.profile);

  await persistSnapshot({ creatorId: input.creatorId, rankedThemes: ranked });
  
  // Send notifications (Telegram for hackathon demo, Web Push for future)
  await sendTelegramNotification(ranked, input.creatorId);
  await sendPushNotification(ranked, input.creatorId);

  return { creatorId: input.creatorId, themesCount: ranked.length };
}
