export interface Entity {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  created: string;
  updated: string;
}

export interface Relation {
  from: string;
  rel: string;
  to: string;
  properties?: Record<string, unknown>;
}

export interface OntologyData {
  entities: Entity[];
  relations: Relation[];
}

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

export type ViewType = 'list' | 'graph';
export type TabType = 'chat' | 'dashboard';
