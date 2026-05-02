import { defineHook } from 'workflow';

// Shared hook instance — imported by both the workflow body and the POST /api/hooks/brightdata route.
// Token format: `bd:{snapshot_id}` — lets the webhook route resume the right waiting workflow.
export const bdHook = defineHook<{ snapshotId: string }>();
