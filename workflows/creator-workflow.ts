import { bdHook } from '@/lib/brightdata-hook';
import {
  triggerInstagramScrapes,
  downloadInstagramProfiles,
  downloadInstagramHashtags,
} from '@/steps/scrape-instagram';
import { fetchCreatorData } from '@/steps/fetch-creator-data';
import { distilThemes } from '@/steps/distil-themes';
import { rankAgainstProfile } from '@/steps/rank-themes';
import { persistSnapshot } from '@/steps/persist-snapshot';
import { sendTelegramNotification } from '@/steps/send-telegram';
import { updateWebsite } from '@/steps/update-website';
import type { RawProfile, RawHashtagFeed } from '@/lib/types';

export async function creatorWorkflow(input: { creatorId: number; runId: number }) {
  'use workflow';

  const creatorData = await fetchCreatorData(input.creatorId);

  const { profileSnapshotId, hashtagSnapshotId } =
    await triggerInstagramScrapes(creatorData.followList);

  // Pause until BrightData fires the profile webhook, then download
  let rawProfiles: RawProfile[] = [];
  for await (const _ of bdHook.create({ token: `bd:${profileSnapshotId}` })) {
    rawProfiles = await downloadInstagramProfiles(profileSnapshotId);
    break;
  }

  // Pause until BrightData fires the hashtag webhook, then download
  let rawHashtags: RawHashtagFeed[] = [];
  for await (const _ of bdHook.create({ token: `bd:${hashtagSnapshotId}` })) {
    rawHashtags = await downloadInstagramHashtags(hashtagSnapshotId);
    break;
  }

  const themes = await distilThemes({ profiles: rawProfiles, hashtagFeeds: rawHashtags });
  const ranked = await rankAgainstProfile(themes, creatorData.profile);

  await persistSnapshot({ creatorId: input.creatorId, rankedThemes: ranked, runId: input.runId });
  
  // Notify in parallel: Telegram for hackathon demo, website refresh for dashboard
  await Promise.all([
    sendTelegramNotification(ranked, input.creatorId),
    updateWebsite(ranked, input.creatorId),
  ]);

  return { creatorId: input.creatorId, themesCount: ranked.length };
}
