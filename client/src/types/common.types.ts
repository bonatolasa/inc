export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'blocked';
