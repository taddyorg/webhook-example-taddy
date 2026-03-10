export interface WebhookPayload {
  uuid: string;
  taddyType: string;
  action: string;
  timestamp: number;
  data: Record<string, unknown>;
  matchingFilters: string[];
}
