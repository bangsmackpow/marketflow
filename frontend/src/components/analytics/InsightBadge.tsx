import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface InsightBadgeProps {
  skill: { slug: string };
  analyticsContext?: {
    bounceRate: number;
    conversionRate: number;
    trafficLevel: "low" | "medium" | "high";
  };
}

const INSIGHTS: Record<string, { match: (ctx: InsightBadgeProps["analyticsContext"]) => boolean; message: string }[]> = {
  "seo-audit": [
    { match: (ctx) => (ctx?.bounceRate || 0) > 60, message: "High bounce rate detected. SEO audit recommended." },
  ],
  "page-cro": [
    { match: (ctx) => (ctx?.conversionRate || 1) < 0.02 && (ctx?.trafficLevel === "high" || ctx?.trafficLevel === "medium"), message: "High traffic, low conversions. Try CRO audit." },
  ],
  "analytics-tracking": [
    { match: () => true, message: "Analytics not fully configured. Set up tracking first." },
  ],
  "site-architecture": [
    { match: (ctx) => (ctx?.bounceRate || 0) > 55, message: "Bounce rate above average. Review site architecture." },
  ],
  "schema-markup": [
    { match: () => true, message: "Schema markup can improve CTR by 30%." },
  ],
};

export default function InsightBadge({ skill, analyticsContext }: InsightBadgeProps) {
  const triggers = INSIGHTS[skill.slug];
  if (!triggers) return null;

  const active = triggers.find((t) => t.match(analyticsContext));
  if (!active) return null;

  const isWarning = active.message.toLowerCase().includes("high") || active.message.toLowerCase().includes("low");
  const isPositive = active.message.toLowerCase().includes("improve") || active.message.toLowerCase().includes("increase");

  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
        isWarning ? "bg-amber-50 text-amber-800" : isPositive ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800"
      }`}
    >
      {isWarning ? (
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      ) : isPositive ? (
        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
      ) : (
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
      )}
      <span>{active.message}</span>
    </div>
  );
}
