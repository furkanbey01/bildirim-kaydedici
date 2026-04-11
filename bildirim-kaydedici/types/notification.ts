export interface SavedNotification {
  id: string;
  appName: string;
  packageName: string;
  title: string;
  text: string;
  subText: string;
  bigText: string;
  ticker: string;
  timestamp: number;
  postTime: string;
  category: string;
  priority: number;
  isOngoing: boolean;
  isGroupSummary: boolean;
  groupKey: string;
  sortKey: string;
  tag: string;
  number: number;
  visibility: number;
  actions: string[];
  extras: Record<string, string>;
  iconColor: string | null;
  receivedAt: string;
}

export type SortOrder = "newest" | "oldest";
export type FilterMode = "all" | "app";
