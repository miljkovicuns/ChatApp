export interface AnalyticsTimeSeriesDto {
  period: string;        // ISO date string (e.g., "2024-01-01")
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  groupsCreated: number;
}
