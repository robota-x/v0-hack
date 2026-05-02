const BASE_URL = 'https://api.brightdata.com/datasets/v3';

function authHeader(): Record<string, string> {
  const token = process.env.BRIGHTDATA_API_TOKEN;
  if (!token) throw new Error('BRIGHTDATA_API_TOKEN is not set');
  return { Authorization: `Bearer ${token}` };
}

interface TriggerOpts {
  collector: string;
  inputs: Record<string, string>[];
  limitPerInput?: number;
  notifyUrl: string;
}

export async function triggerScrape(opts: TriggerOpts): Promise<string> {
  const res = await fetch(`${BASE_URL}/trigger`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collector: opts.collector,
      inputs: opts.inputs,
      limit_per_input: opts.limitPerInput ?? 50,
      notify: opts.notifyUrl,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BrightData trigger failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { snapshot_id: string };
  return json.snapshot_id;
}

export async function downloadSnapshot<T>(snapshotId: string): Promise<T[]> {
  const res = await fetch(`${BASE_URL}/snapshot/${snapshotId}?format=json`, {
    headers: authHeader(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BrightData download failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T[]>;
}
