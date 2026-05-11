import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Eye, MousePointerClick, ArrowLeftRight, Clock, Users } from "lucide-react";
import { apiFetch } from "../../lib/api";

interface Metric {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  unit: string;
}

interface AnalyticsResponse {
  metrics: {
    sessions: Metric;
    pageViews: Metric;
    conversions: Metric;
    bounceRate: Metric;
    avgSessionDuration: Metric;
  };
}

const METRIC_ICONS: Record<string, typeof BarChart3> = {
  Sessions: Users,
  "Page Views": Eye,
  Conversions: MousePointerClick,
  "Bounce Rate": ArrowLeftRight,
  "Avg. Session": Clock,
};

function formatValue(value: number, unit: string): string {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "s") {
    const min = Math.floor(value / 60);
    const sec = Math.floor(value % 60);
    return `${min}m ${sec}s`;
  }
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toLocaleString();
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = METRIC_ICONS[metric.label] || BarChart3;
  const isPositive = metric.change > 0;
  const isBounce = metric.label === "Bounce Rate";

  const goodChange = isBounce ? !isPositive : isPositive;

  return (
    <div className="card flex items-start gap-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: "var(--clr-muted, #f1f3f5)", color: "var(--clr-primary, #0070c4)" }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
          {metric.label}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
          {formatValue(metric.value, metric.unit)}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {goodChange ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
          )}
          <span className={`text-xs font-medium ${goodChange ? "text-green-600" : "text-red-600"}`}>
            {metric.change > 0 ? "+" : ""}{metric.change.toFixed(1)}%
          </span>
          <span className="text-xs" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
            vs 30 days ago
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MetricsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => apiFetch<AnalyticsResponse>("/analytics"),
    refetchInterval: 120000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card animate-pulse h-28" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    data.metrics.sessions,
    data.metrics.pageViews,
    data.metrics.conversions,
    data.metrics.bounceRate,
    data.metrics.avgSessionDuration,
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  );
}
