import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/refresh
 * 
 * Called by the workflow's update-website step to trigger a cache revalidation
 * of the dashboard page after a new snapshot is persisted.
 */
export async function POST(request: Request) {
  // Verify internal API token if configured
  const authHeader = request.headers.get("Authorization");
  if (process.env.INTERNAL_API_TOKEN) {
    const token = authHeader?.replace("Bearer ", "");
    if (token !== process.env.INTERNAL_API_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Revalidate the dashboard page cache
  revalidatePath("/");
  revalidatePath("/api/snapshots/latest");

  console.log("[dashboard/refresh] Revalidated dashboard paths");

  return NextResponse.json({ success: true, revalidatedAt: new Date().toISOString() });
}
