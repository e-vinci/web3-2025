import { useEffect, useState } from "react";

import { apiRequest } from "../lib/rest";
import { getToken } from "../lib/token";
import type { Export, ExportProgress } from "../types/Export";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ExportStream {
  record: Export | null;
  progress: ExportProgress | null;
  error: string | null;
}

/**
 * Watches one export, live, over a WebSocket.
 *
 * The browser's `WebSocket` is built in — there is no library on this side,
 * and nothing to install. The server speaks to it through `ws`.
 *
 * Three things are different from the plain HTTP requests everywhere else in
 * this app, and all three are worth noticing:
 *
 *   1. **The token is in the URL.** `new WebSocket(url)` takes a URL and
 *      nothing else, exactly like a download link. The moment the browser
 *      makes the request instead of your `fetch`, your headers are gone.
 *   2. **Every message for this user arrives here**, not just this export's.
 *      One socket carries them all, so filtering is now your job — see the
 *      `exportId` check below.
 *   3. **A socket tells you what happens next, not what already happened.**
 *      Hence the one `GET` before opening it: if the job finished while the
 *      page was loading, no event is ever coming and the socket would wait
 *      forever for news that is already in the past.
 */
export function useExportSocket(exportId: number | null): ExportStream {
  const [record, setRecord] = useState<Export | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resetting during render rather than inside the effect: a new export id
  // means the old progress and the old error belong to a different job.
  const [watchedId, setWatchedId] = useState(exportId);
  if (exportId !== watchedId) {
    setWatchedId(exportId);
    setProgress(null);
    setError(null);
  }

  useEffect(() => {
    if (exportId === null) return;

    let cancelled = false;
    const socket = new WebSocket(
      `${API_BASE_URL.replace(/^http/, "ws")}/ws/exports?token=${getToken()}`
    );

    // See docblock point 3: this covers a job that finished before the socket opened.
    void apiRequest<Export>(`/api/exports/${exportId}`).then((current) => {
      if (cancelled) return;
      setRecord(current);
      if (current.status === "completed" || current.status === "failed") {
        if (current.failedReason) setError(current.failedReason);
        socket.close();
      }
    });

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as {
        type: "progress" | "completed" | "failed";
        exportId: number;
        data?: ExportProgress;
        failedReason?: string;
      };

      if (message.exportId !== exportId) return;

      if (message.type === "progress" && message.data) {
        setProgress(message.data);
        return;
      }

      setProgress(null);

      if (message.type === "failed") {
        setError(message.failedReason ?? "The export failed");
        setRecord((previous) =>
          previous ? { ...previous, status: "failed" } : previous
        );
      } else {
        // Re-read the row: the event says it finished, the row carries the
        // row count and the file.
        void apiRequest<Export>(`/api/exports/${exportId}`).then((fresh) => {
          if (!cancelled) setRecord(fresh);
        });
      }

      socket.close();
    };

    // Unlike `EventSource`, a WebSocket does not reconnect by itself. A
    // dropped connection stays dropped until you write the retry loop — which
    // is the main reason to prefer Server-Sent Events when the traffic only
    // ever goes one way.
    socket.onerror = () => {
      if (!cancelled) setError("Lost the connection to the server");
    };

    return () => {
      cancelled = true;
      socket.close();
    };
  }, [exportId]);

  return { record, progress, error };
}
