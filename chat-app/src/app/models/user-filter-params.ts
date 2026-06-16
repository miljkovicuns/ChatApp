export interface UserFilterParams {
  searchQuery?: string;
  lastSeen?: 'all' | 'today' | 'week' | 'month' | 'offline';
  hasImage?: 'all' | 'hasImage' | 'noImage';
  sortBy?: 'name' | 'lastSeen' | 'recent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
}
