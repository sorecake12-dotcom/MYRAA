import { HistoryMessageEntry, CommandLogEntry } from '../types';

const MESSAGES_KEY = 'myra_history_messages';
const COMMAND_LOGS_KEY = 'myra_command_logs';

export function getHistoryMessages(): HistoryMessageEntry[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load history messages:', err);
    return [];
  }
}

export function saveHistoryMessage(entry: HistoryMessageEntry): void {
  try {
    const current = getHistoryMessages();
    // Avoid duplicate id insertion
    if (current.some(m => m.id === entry.id)) return;
    const updated = [...current, entry];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save history message:', err);
  }
}

export function getCommandLogs(): CommandLogEntry[] {
  try {
    const raw = localStorage.getItem(COMMAND_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load command logs:', err);
    return [];
  }
}

export function saveCommandLog(entry: CommandLogEntry): void {
  try {
    const current = getCommandLogs();
    if (current.some(c => c.id === entry.id)) return;
    const updated = [...current, entry];
    localStorage.setItem(COMMAND_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save command log:', err);
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(MESSAGES_KEY);
    localStorage.removeItem(COMMAND_LOGS_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

export function exportHistoryAsJSON(assistantName: string): void {
  const data = {
    exportDate: new Date().toISOString(),
    assistantName: assistantName || 'MYRA',
    conversationHistory: getHistoryMessages(),
    commandLogs: getCommandLogs(),
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${assistantName.toLowerCase()}_history_export_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportHistoryAsTXT(assistantName: string): void {
  const messages = getHistoryMessages();
  const logs = getCommandLogs();

  let txt = `==================================================\n`;
  txt += `${assistantName.toUpperCase()} ASSISTANT - CONVERSATION & COMMAND LOGS\n`;
  txt += `Export Date: ${new Date().toLocaleString()}\n`;
  txt += `==================================================\n\n`;

  txt += `--- CONVERSATION HISTORY (${messages.length} messages) ---\n\n`;
  messages.forEach((msg, idx) => {
    const timeStr = new Date(msg.timestamp).toLocaleString();
    txt += `[${idx + 1}] ${timeStr} | ${msg.speaker.toUpperCase()} (${msg.inputType.toUpperCase()})\n`;
    txt += `Session ID: ${msg.sessionId}\n`;
    txt += `Message: ${msg.content}\n`;
    if (msg.commandExecuted) {
      txt += `Command Action: ${msg.commandExecuted}\n`;
    }
    txt += `--------------------------------------------------\n`;
  });

  txt += `\n\n--- COMMAND EXECUTION LOGS (${logs.length} logs) ---\n\n`;
  logs.forEach((log, idx) => {
    const timeStr = new Date(log.timestamp).toLocaleString();
    txt += `[${idx + 1}] ${timeStr} | Status: ${log.status}\n`;
    txt += `User Input: "${log.receivedInput}"\n`;
    txt += `Parsed: ${log.parsedCommand}\n`;
    txt += `Action: ${log.actionExecuted}\n`;
    txt += `Duration: ${log.executionDurationMs} ms\n`;
    if (log.errorMessage) {
      txt += `Error: ${log.errorMessage}\n`;
    }
    txt += `--------------------------------------------------\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${assistantName.toLowerCase()}_history_export_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
