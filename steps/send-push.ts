import type { RankedTheme } from '@/lib/types';

export async function sendPushNotification(
  rankedThemes: RankedTheme[],
  creatorId: string
): Promise<void> {
  'use step';

  const top = rankedThemes[0];

  // TODO: replace with Web Push VAPID send
  // const subscription = await db.query('SELECT push_subscription FROM users WHERE id = $1', [creatorId]);
  // await webpush.sendNotification(subscription, JSON.stringify({
  //   title: "What's trending in your sphere",
  //   body: `${top.name} — ${top.whyItMatters}`,
  //   url: '/dashboard',
  // }));
  console.log(`[sendPushNotification] TODO: send Web Push to creatorId=${creatorId}`);
  console.log(`[sendPushNotification] title: "What's trending in your sphere"`);
  console.log(`[sendPushNotification] body:  "${top.name} — ${top.whyItMatters.slice(0, 80)}..."`);
  console.log(`[sendPushNotification] ${rankedThemes.length} ranked themes in payload`);
}
