import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, Shield, Users, Building2, BarChart3, RotateCcw } from "lucide-react";
import { apiFetch } from "../../lib/api";

interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  completenessScore: number;
  activeUsers: number;
  totalUsers: number;
  createdAt: string;
  productContext: Record<string, string> | null;
}

interface AdminResponse {
  companies: CompanyRecord[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "companies", search, page],
    queryFn: () =>
      apiFetch<AdminResponse>(
        `/admin/companies?search=${encodeURIComponent(search)}&page=${page}&limit=20`
      ),
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiFetch("/admin/refresh-skills", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" style={{ color: "var(--clr-primary, #0070c4)" }} />
            <h2 className="text-2xl font-bold" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
              Admin Portal
            </h2>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
            Built Networks command center
          </p>
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RotateCcw className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          Refresh Skills
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--clr-muted-foreground, #adb5bd)" }} />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search companies by name or slug..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.companies.map((company) => (
            <div key={company.id} className="card !p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: "var(--clr-muted, #f1f3f5)",
                      color: "var(--clr-primary, #0070c4)",
                    }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-surface-900 truncate">{company.name}</h4>
                    <p className="text-xs text-surface-500">/{company.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-surface-500">Score</p>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: company.completenessScore >= 50 ? "var(--clr-primary, #0070c4)" : "text-surface-700" }}>
                      {company.completenessScore}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-500">Users</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-surface-400" />
                      <span className="text-sm font-semibold tabular-nums text-surface-700">{company.activeUsers}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-500">Industry</p>
                    <p className="text-sm font-medium text-surface-700">
                      {company.productContext?.industry || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data && data.total > data.limit && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-surface-500">
                Showing {data.companies.length} of {data.total} companies
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-ghost text-xs"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.companies.length < data.limit}
                  className="btn-ghost text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
