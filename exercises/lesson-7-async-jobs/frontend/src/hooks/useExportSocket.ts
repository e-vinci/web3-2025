import { useEffect, useState } from "react";

import { getToken } from "../lib/token";
import type { Export, ExportProgress } from "../types/Export";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ExportStream {
  record: Export | null;
  progress: ExportProgress | null;
  error: string | null;
}

/**
 * The WebSocket version of `useExportStream`.
 *
 * This is the finished state of the optional "swap SSE for WebSockets"
 * exercise. It is not wired up: `ExportPage.tsx` imports `useExportStream`.
 * To try this one, change that single import — the two hooks take the same
 * argument and return the same shape, which is the point.
 *
 * Compare it with `useExportStream.ts` and count the differences. They are:
 *
 *   1. `ws://` instead of `http://`, and one `onmessage` instead of four
 *      named listeners (a WebSocket frame has no event name of its own, so
 *      the message carries a `type` field we switch on).
 *   2. Every message arrives, for every export this user owns, so the hook
 *      filters on `exportId` itself.
 *   3. **No automatic reconnection.** `EventSource` reconnects for free;
 *      here a dropped connection stays dropped until you write the retry
 *      loop yourself. That is the main reason to prefer SSE when the traffic
 *      only goes one way.
 */
export function useExportSocket(exportId: number | null): ExportStream {
  const [record, setRecord] = useState<Export | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [watchedId, setWatchedId] = useState(exportId);
  if (exportId !== watchedId) {
    setWatchedId(exportId);
    setProgress(null);
    setError(null);
  }

  useEffect(() => {
    if (exportId === null) return;

    const wsUrl = API_BASE_URL.replace(/^http/, "ws");
    const socket = new WebSocket(`${wsUrl}/ws/exports?token=${getToken()}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as {
        type: "progress" | "completed" | "failed";
        exportId: number;
        data?: ExportProgress;
        failedReason?: string;
      };

      // One socket carries every export this user owns, so the filter that
      // the SSE route did on the server has to happen here instead.
      if (message.exportId !== exportId) return;

      if (message.type === "progress" && message.data) {
        setProgress(message.data);
      } else if (message.type === "completed") {
        setProgress(null);
        setRecord((previous) =>
          previous ? { ...previous, status: "completed" } : previous
        );
        socket.close();
      } else if (message.type === "failed") {
        setProgress(null);
        setError(message.failedReason ?? "The export failed");
        socket.close();
      }
    };

    socket.onerror = () => setError("Lost the connection to the server");

    return () => socket.close();
  }, [exportId]);

  return { record, progress, error };
}
