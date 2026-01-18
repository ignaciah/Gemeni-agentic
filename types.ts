
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github';
}

export interface Attachment {
  data: string; // base64
  mimeType: string;
  fileName: string;
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
  // Metadata for rendering
  fileName?: string;
}

export interface ToolLog {
  name: string;
  args: any;
  result: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
  timestamp: number;
  sources?: GroundingSource[];
  toolLogs?: ToolLog[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export enum ConnectionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}
