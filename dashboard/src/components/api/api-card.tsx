import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { ApiResponse } from "@/modules/apis/api.types";
import { formatRateLimit } from "@/utils/format-rate-limit";

type ApiCardProps = {
  api: ApiResponse;
};

export function ApiCard({ api }: ApiCardProps) {
  return (
    <Link
      href={`/apis/${api.id}`}
      className="group rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition hover:border-slate-700 hover:bg-slate-900/80"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="truncate font-medium text-white group-hover:text-blue-400">
              {api.name}
            </h2>

            <StatusBadge status={api.status} />
          </div>

          <p className="mt-2 truncate text-sm text-slate-400">{api.baseUrl}</p>
        </div>

        <span className="shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300">
          →
        </span>
      </div>

      <div className="mt-6 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            API key
          </p>

          <p className="mt-1 font-mono text-sm text-slate-300">
            {api.apiKeyPrefix}••••
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Rate limit
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {formatRateLimit(api.rateLimit)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Methods
          </p>

          <p className="mt-1 truncate text-sm text-slate-300">
            {api.allowedMethods.join(" · ")}
          </p>
        </div>
      </div>
    </Link>
  );
}
