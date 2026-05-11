export interface AnalyticsMetric {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  unit: string;
}

export interface AnalyticsData {
  sessions: AnalyticsMetric;
  pageViews: AnalyticsMetric;
  conversions: AnalyticsMetric;
  bounceRate: AnalyticsMetric;
  avgSessionDuration: AnalyticsMetric;
  topPages: { path: string; views: number }[];
  trafficSources: { source: string; sessions: number }[];
}

export interface ConnectParams {
  authCode: string;
  redirectUri: string;
}

export const DEFAULT_METRICS: AnalyticsData = {
  sessions: { label: "Sessions", value: 0, previousValue: 0, change: 0, unit: "" },
  pageViews: { label: "Page Views", value: 0, previousValue: 0, change: 0, unit: "" },
  conversions: { label: "Conversions", value: 0, previousValue: 0, change: 0, unit: "" },
  bounceRate: { label: "Bounce Rate", value: 0, previousValue: 0, change: 0, unit: "%" },
  avgSessionDuration: { label: "Avg. Session", value: 0, previousValue: 0, change: 0, unit: "s" },
  topPages: [],
  trafficSources: [],
};

export abstract class AnalyticsProvider {
  abstract key: string;
  abstract name: string;
  abstract connect(params: ConnectParams): Promise<{ accessToken: string; refreshToken: string }>;
  abstract refreshToken(token: string): Promise<string>;
  abstract getMetrics(accessToken: string, startDate: Date, endDate: Date): Promise<AnalyticsData>;
  abstract isConnected(tokens: Record<string, string>): boolean;
}
