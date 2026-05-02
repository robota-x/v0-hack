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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <p className="mb-2 text-6xl">🤫</p>
        <h1 className="font-display text-2xl font-extrabold text-[#1e1b4b]">
          Secret Hackathon Controls
        </h1>
      </div>

      <Button
        onClick={triggerWorkflow}
        disabled={isLoading}
        size="lg"
        className="neo-shadow-hover h-40 w-40 rounded-full border-2 border-black bg-[#a3e635] text-2xl font-black text-[#1e1b4b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 disabled:opacity-70"
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
          className={`neo-glass px-6 py-4 text-center ${
            result.success
              ? "text-[#1e1b4b]"
              : "bg-[#ffdce3] text-[#9f1239]"
          }`}
        >
          <p className="text-lg font-medium">
            {result.success ? "✅" : "❌"} {result.message}
          </p>
        </div>
      )}

      <p className="text-sm font-semibold text-[#1e1b4b]/70">
        This page is not linked anywhere. You found the secret! 🎉
      </p>
    </div>
  );
}
