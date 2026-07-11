// analytics-summary.dto.ts
export interface TopUserDto {
  userId: string;
  username: string;
  fullName: string;
  messageCount: number;
}

export interface TopGroupDto {
  groupId: string;
  groupName: string;
  messageCount: number;
}

export interface AnalyticsSummaryDto {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  totalGroupsCreated: number;
  topUsers: TopUserDto[];
  topGroups: TopGroupDto[];
}
