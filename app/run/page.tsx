"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SecretRunPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function triggerWorkflow() {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/cron/run");
      const data = await res.json();

      if (data.started) {
        setResult({
          success: true,
          message: `Workflow started! Run ID: ${data.runId}`,
        });
      } else {
        setResult({
          success: false,
          message: "Something went wrong...",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "Failed to trigger workflow",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <p className="mb-2 text-6xl">🤫</p>
        <h1 className="font-serif text-2xl font-medium text-foreground/70">
          Secret Hackathon Controls
        </h1>
      </div>

      <Button
        onClick={triggerWorkflow}
        disabled={isLoading}
        size="lg"
        className="h-40 w-40 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-2xl font-bold text-white shadow-2xl transition-all hover:scale-105 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 active:scale-95 disabled:opacity-70"
      >
        {isLoading ? (
          <span className="animate-pulse">🚀</span>
        ) : (
          <span className="flex flex-col items-center gap-1">
            <span className="text-4xl">🔥</span>
            <span>RUN IT!</span>
          </span>
        )}
      </Button>

      {result && (
        <div
          className={`rounded-xl px-6 py-4 text-center ${
            result.success
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800"
          }`}
        >
          <p className="text-lg font-medium">
            {result.success ? "✅" : "❌"} {result.message}
          </p>
        </div>
      )}

      <p className="text-sm text-foreground/40">
        This page is not linked anywhere. You found the secret! 🎉
      </p>
    </div>
  );
}
