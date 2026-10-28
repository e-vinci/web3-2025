import { useEffect, useRef, useState } from "react";

import { getToken } from "../lib/token";
import type { Export, ExportProgress } from "../types/Export";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ExportStream {
  record: Export | null;
  progress: ExportProgress | null;
  error: string | null;
}

/**
 * Watches one export, live.
 *
 * `EventSource` is built into every browser. There is no library here, no
 * `npm install`, and no polling loop: the browser opens one HTTP request, the
 * server holds it open, and `onmessage` fires whenever the server writes a
 * line. If the connection drops, `EventSource` reconnects by itself — that
 * retry behaviour is part of the standard, and it is the main reason to reach
 * for Server-Sent Events before WebSockets when the traffic only goes one way.
 *
 * The token travels in the query string because `EventSource` cannot set an
 * `Authorization` header — the constructor takes a URL and nothing else. See
 * the note in the backend's `middleware/requireAuth.ts` for why that is a
 * compromise rather than a free choice.
 */
export function useExportStream(exportId: number | null): ExportStream {
  const [record, setRecord] = useState<Export | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keeps the live connection out of React state: changing it must not cause
  // a re-render, and the cleanup function needs to reach it.
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (exportId === null) return;

    setProgress(null);
    setError(null);

    const token = getToken();
    const source = new EventSource(
      `${API_BASE_URL}/api/exports/${exportId}/events?token=${token}`
    );
    sourceRef.current = source;

    // Each `event:` line the server writes becomes a named event here. They
    // are not `message` events, so `onmessage` would never fire for them —
    // the names have to match the ones the server sends.
    source.addEventListener("status", (event) => {
      setRecord(JSON.parse(event.data) as Export);
    });

    source.addEventListener("progress", (event) => {
      setProgress(JSON.parse(event.data) as ExportProgress);
    });

    source.addEventListener("completed", (event) => {
      setRecord(JSON.parse(event.data) as Export);
      setProgress(null);
      // The server has closed its side; close ours too, or the browser will
      // dutifully reconnect to a stream that has nothing left to say.
      source.close();
    });

    source.addEventListener("failed", (event) => {
      const failed = JSON.parse(event.data) as Export;
      setRecord(failed);
      setError(failed.failedReason ?? "The export failed");
      setProgress(null);
      source.close();
    });

    // This fires for a dropped connection as well as a real error, and
    // `EventSource` will try to reconnect on its own afterwards. Showing a
    // message here would blame the user's wifi on the export.
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setError("Lost the connection to the server");
      }
    };

    // Without this, navigating away leaves the request open: the server keeps
    // a dead listener and the browser keeps a socket. Effects that open
    // something must close it.
    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [exportId]);

  return { record, progress, error };
}
