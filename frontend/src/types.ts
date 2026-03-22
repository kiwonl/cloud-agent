export type AppMode = 'migration' | 'gcp_advisor';
export type Page = 'upload' | 'analysis' | 'mapping' | 'checklist' | 'terraform' | 'audit_setup' | 'audit_report' | 'audit_live';

export interface NavItem {
  id: Page;
  label: string;
  icon: string;
}

export interface VerificationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  note: string;
  status: 'complete' | 'warning' | 'pending';
}

export interface MappingItem {
  source: {
    name: string;
    id: string;
    icon: string;
    color: string;
  };
  target: {
    name: string;
    id: string;
    icon: string;
  };
  confidence: number;
  status: 'verified' | 'pending';
}
export interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp?: string;
}
