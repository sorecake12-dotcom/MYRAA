import { AppCommand } from '../types';

export function parseVoiceCommand(text: string): AppCommand | null {
  const lower = text.toLowerCase().trim();

  // Flashlight / Torch
  if (
    lower.includes('torch on') ||
    lower.includes('flashlight on') ||
    lower.includes('torch chalu') ||
    lower.includes('flashlight chalu') ||
    lower.includes('light on')
  ) {
    return { type: 'FLASHLIGHT_ON', params: {}, rawInput: text };
  }

  if (
    lower.includes('torch off') ||
    lower.includes('flashlight off') ||
    lower.includes('torch band') ||
    lower.includes('flashlight band') ||
    lower.includes('light off')
  ) {
    return { type: 'FLASHLIGHT_OFF', params: {}, rawInput: text };
  }

  // Volume controls
  if (
    lower.includes('volume badhao') ||
    lower.includes('volume up') ||
    lower.includes('aawaz badhao') ||
    lower.includes('volume tez')
  ) {
    return { type: 'VOLUME_UP', params: {}, rawInput: text };
  }

  if (
    lower.includes('volume kam') ||
    lower.includes('volume down') ||
    lower.includes('aawaz kam') ||
    lower.includes('volume ghataye')
  ) {
    return { type: 'VOLUME_DOWN', params: {}, rawInput: text };
  }

  // Wi-Fi
  if (lower.includes('wifi on') || lower.includes('wifi chalu')) {
    return { type: 'WIFI_ON', params: {}, rawInput: text };
  }
  if (lower.includes('wifi off') || lower.includes('wifi band')) {
    return { type: 'WIFI_OFF', params: {}, rawInput: text };
  }

  // Bluetooth
  if (lower.includes('bluetooth on') || lower.includes('bluetooth chalu')) {
    return { type: 'BLUETOOTH_ON', params: {}, rawInput: text };
  }
  if (lower.includes('bluetooth off') || lower.includes('bluetooth band')) {
    return { type: 'BLUETOOTH_OFF', params: {}, rawInput: text };
  }

  // Close app / Close current app
  if (
    lower.includes('app band karo') ||
    lower.includes('close app') ||
    lower.includes('close current app') ||
    lower.includes('home screen par jao') ||
    lower.includes('go to home')
  ) {
    return { type: 'CLOSE_APP', params: {}, rawInput: text };
  }

  // Open App
  const openPatterns = [
    /(?:open|kholo|chalu karo)\s+([a-z0-9\s]+)/i,
    /([a-z0-9\s]+)\s+(?:kholo|open karo|chalu karo)/i,
  ];

  for (const pattern of openPatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      const appName = match[1].trim();
      const knownApps = [
        'youtube', 'chrome', 'gmail', 'maps', 'spotify',
        'netflix', 'twitter', 'telegram', 'settings',
        'calculator', 'calendar', 'clock', 'camera'
      ];
      const found = knownApps.find(a => appName.includes(a));
      if (found) {
        return { type: 'OPEN_APP', params: { appName: found }, rawInput: text };
      }
    }
  }

  return null;
}
