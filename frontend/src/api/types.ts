export type PageType = "pricing" | "changelog" | "blog" | "features" | "other";

export type ChangeCategory =
  | "pricing_change"
  | "new_feature"
  | "messaging_change"
  | "promotion"
  | "other";

export interface Me {
  id: number;
  email: string;
  demo_mode: boolean;
}

export interface TrackedUrl {
  id: number;
  competitor_id: number;
  url: string;
  page_type: PageType;
  is_active: boolean;
  last_checked_at: string | null;
  last_status: string | null;
}

export interface Competitor {
  id: number;
  name: string;
  website: string;
  notes: string | null;
  color: string;
  created_at: string;
  tracked_urls: TrackedUrl[];
}

export interface ChangeEvent {
  id: number;
  tracked_url_id: number;
  detected_at: string;
  summary: string | null;
  category: ChangeCategory | null;
  impact_score: number | null;
  recommended_action: string | null;
  analysis_status: "pending" | "done" | "failed";
  competitor_id: number | null;
  competitor_name: string | null;
  competitor_color: string | null;
  url: string | null;
  page_type: PageType | null;
}

export interface DiffLine {
  type: "add" | "del" | "ctx" | "hunk";
  text: string;
}

export interface DiffResponse {
  change_event_id: number;
  old_fetched_at: string;
  new_fetched_at: string;
  lines: DiffLine[];
}

export interface CheckRunResult {
  checked_urls: number;
  errors: number;
  new_changes: ChangeEvent[];
}

export interface Notification {
  id: number;
  change_event_id: number | null;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface Brief {
  id: number;
  period_days: number;
  content_md: string;
  generated_at: string;
}

export interface UserSettings {
  slack_webhook_url: string | null;
  alert_impact_threshold: number;
}

export interface TimelineBucket {
  date: string;
  count: number;
}

export interface ImpactBucket {
  impact: number;
  count: number;
}

export interface StatsOverview {
  competitors: number;
  tracked_urls: number;
  changes_7d: number;
  high_impact_7d: number;
  timeline: TimelineBucket[];
  impact_distribution: ImpactBucket[];
}
