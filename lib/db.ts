import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

// Single-creator demo mode for hackathon scope.
// All routes operate against creator id=1; we'll generalize once auth is in.
export const DEMO_CREATOR_ID = 1;

export type Creator = {
  id: number;
  name: string | null;
  niche: string | null;
  interests: string[];
  style: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type FollowAccount = {
  id: number;
  creator_id: number;
  username: string;
  created_at: string;
};

export type FollowHashtag = {
  id: number;
  creator_id: number;
  tag: string;
  created_at: string;
};

export type SnapshotTheme = {
  rank: number;
  title: string;
  summary: string;
  source_count?: number;
  why_it_matters?: string;
};

export type Snapshot = {
  id: number;
  creator_id: number;
  themes: SnapshotTheme[];
  summary: string | null;
  created_at: string;
};
