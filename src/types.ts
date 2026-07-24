export type PersonalityMode = 'GF' | 'PROFESSIONAL' | 'ASSISTANT';

export type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  commandExecuted?: string;
  inputType?: 'voice' | 'text';
  sessionId?: string;
}

export interface HistoryMessageEntry {
  id: string;
  sessionId: string;
  timestamp: number;
  speaker: 'User' | 'Assistant';
  content: string;
  inputType: 'voice' | 'text';
  commandExecuted?: string;
}

export interface CommandLogEntry {
  id: string;
  timestamp: number;
  receivedInput: string;
  parsedCommand: string;
  actionExecuted: string;
  status: 'SUCCESS' | 'FAILED';
  executionDurationMs: number;
  errorMessage?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
}

export interface ModelOption {
  id: string;
  label: string;
  description: string;
}

export type CommandType =
  | 'OPEN_APP'
  | 'CLOSE_APP'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'FLASHLIGHT_ON'
  | 'FLASHLIGHT_OFF'
  | 'WIFI_ON'
  | 'WIFI_OFF'
  | 'BLUETOOTH_ON'
  | 'BLUETOOTH_OFF';

export interface AppCommand {
  type: CommandType;
  params: Record<string, string>;
  rawInput: string;
}

export interface MyraSettings {
  apiKey: string;
  userName: string;
  assistantName: string;
  personalityMode: PersonalityMode;
  model: string;
  voice: string;
  accessibilityEnabled: boolean;
  overlayOrbEnabled: boolean;
}

export interface DeviceState {
  currentApp: string | null;
  flashlightOn: boolean;
  wifiOn: boolean;
  bluetoothOn: boolean;
  volume: number; // 0 to 100
  battery: number;
  ramUsage: number;
  recentNotification: string | null;
}
