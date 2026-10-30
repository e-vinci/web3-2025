import { useState } from "react";

import { apiRequest } from "../../lib/rest";
import { getToken } from "../../lib/token";
import { useExportSocket } from "../../hooks/useExportSocket";
import type { Export } from "../../types/Export";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ExportPage() {
  const [exportId, setExportId] = useState<number | null>(null);
  const [requesting, setRequesting] = useState(false);
  const { record, progress, error } = useExportSocket(exportId);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      // The response arrives immediately with a 202 and an id. Nothing has
      // been exported yet — this is a receipt, not a report.
      const created = await apiRequest<Export>("/api/exports", { method: "POST" });
      setExportId(created.id);
    } finally {
      setRequesting(false);
    }
  };

  const isWorking =
    record !== null && (record.status === "queued" || record.status === "running");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Export your expenses</h2>

      <p className="text-slate-600">
        We will build a CSV of every expense you paid or took part in. It runs in the
        background, so you can keep using the app while it works.
      </p>

      <button
        type="button"
        onClick={handleRequest}
        disabled={requesting || isWorking}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300"
      >
        {isWorking ? "Working…" : "Export my expenses"}
      </button>

      {/* Progress only exists while the worker is reporting it. */}
      {progress && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">{progress.step}…</p>
        </div>
      )}

      {record?.status === "completed" && (
        <div className="rounded border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Done — {record.rowCount} expense{record.rowCount === 1 ? "" : "s"}.
          </p>
          {/*
            A plain link, not a fetch. The browser has to make this request
            itself for the file to land in the Downloads folder, and that means
            the token cannot travel in a header here either — same reason as
            the WebSocket URL.
          */}
          <a
            className="text-sm font-semibold text-indigo-700 underline"
            href={`${API_BASE_URL}/api/exports/${record.id}/download?token=${getToken()}`}
          >
            Download the CSV
          </a>
        </div>
      )}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

export default ExportPage;
