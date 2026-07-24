import React, { useState } from 'react';
import { X, CheckCircle, ShieldAlert, User, Key, Cpu, Volume2, Heart, Sparkles, Bot } from 'lucide-react';
import { MyraSettings, PersonalityMode } from '../types';

interface SettingsModalProps {
  settings: MyraSettings;
  onSave: (newSettings: MyraSettings) => void;
  onClose: () => void;
}

const VOICE_OPTIONS = [
  { id: 'Aoede', name: 'Aoede (Female - Default)' },
  { id: 'Charon', name: 'Charon (Male)' },
  { id: 'Kore', name: 'Kore (Female)' },
  { id: 'Fenrir', name: 'Fenrir (Male)' },
  { id: 'Puck', name: 'Puck (Male)' },
  { id: 'Leda', name: 'Leda (Female)' },
  { id: 'Orus', name: 'Orus (Male)' },
  { id: 'Zephyr', name: 'Zephyr (Female)' },
];

const MODEL_OPTIONS = [
  {
    id: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
    label: 'Native Audio (Human Voice) — DEFAULT',
  },
  {
    id: 'models/gemini-2.0-flash-live-001',
    label: 'Flash Live (Fast)',
  },
  {
    id: 'models/gemini-2.5-flash-preview-native-audio-dialog',
    label: 'Pro Audio Dialog',
  },
];

const NAME_PRESETS = ['MYRA', 'IRIS', 'Jarvis', 'Nova', 'Friday'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<MyraSettings>({ ...settings });
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSaveAll = () => {
    setErrorMsg(null);
    // Validate assistant name
    if (!localSettings.assistantName.trim()) {
      setErrorMsg('Assistant Name cannot be empty.');
      return;
    }

    onSave(localSettings);
    setToastMsg(`Settings saved! Assistant updated to ${localSettings.assistantName.trim()}`);
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      id="settings-modal-overlay"
    >
      <div className="w-full max-w-lg bg-[#0F0F0F] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141414] border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF1744]" />
            <h2 className="text-base font-bold text-white tracking-wider uppercase font-sans">
              Assistant Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#222222]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 text-sm max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Toast Message */}
          {toastMsg && (
            <div className="p-3 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-xl flex items-center gap-2 text-xs font-mono">
              <CheckCircle className="w-4 h-4" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-[#FF1744]/10 border border-[#FF1744]/40 text-[#FF1744] rounded-xl flex items-center gap-2 text-xs font-mono">
              <ShieldAlert className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Gemini API Key Setting (Highest Priority) */}
          <div className="space-y-1.5 p-3.5 bg-[#151515] border border-[#FF1744]/30 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-[#FF1744] flex items-center gap-1.5 uppercase tracking-wider font-bold">
                <Key className="w-4 h-4 text-[#FF1744]" /> Gemini API Key
              </label>
              <button
                type="button"
                onClick={() => setShowKeySecret(!showKeySecret)}
                className="text-[11px] font-mono text-[#888888] hover:text-white underline"
              >
                {showKeySecret ? 'Hide Key' : 'Show Key'}
              </button>
            </div>
            <p className="text-[11px] text-[#AAAAAA]">
              Stored securely with EncryptedSharedPreferences. Reconnects Gemini Live WebSocket automatically when updated.
            </p>
            <input
              type={showKeySecret ? 'text' : 'password'}
              value={localSettings.apiKey}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, apiKey: e.target.value })
              }
              placeholder="AIzaSy... (Leave empty to use server default)"
              className="w-full bg-[#0A0A0A] border border-[#333333] focus:border-[#FF1744] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none"
            />
          </div>

          {/* Assistant Name Setting */}
          <div className="space-y-2 p-3.5 bg-[#151515] border border-[#222222] rounded-xl">
            <label className="text-xs font-mono text-[#888888] flex items-center gap-1.5 uppercase tracking-wider font-bold">
              <Bot className="w-4 h-4 text-[#FF1744]" /> Assistant Name
            </label>
            <p className="text-[11px] text-[#AAAAAA]">
              Change assistant name anytime. Displays across greetings, chat header, orb label, system prompt, and voice responses.
            </p>
            <input
              type="text"
              value={localSettings.assistantName}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, assistantName: e.target.value })
              }
              placeholder="e.g. MYRA, IRIS, Jarvis, Nova, Friday"
              className="w-full bg-[#0A0A0A] border border-[#333333] focus:border-[#FF1744] rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-[#666666]">Presets:</span>
              {NAME_PRESETS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, assistantName: name })
                  }
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all ${
                    localSettings.assistantName.toUpperCase() === name.toUpperCase()
                      ? 'bg-[#FF1744] text-white font-bold'
                      : 'bg-[#222222] text-[#AAAAAA] hover:text-white'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* User Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#888888] flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-[#FF1744]" /> Your Name / Title
            </label>
            <input
              type="text"
              value={localSettings.userName}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, userName: e.target.value })
              }
              placeholder="e.g. Sir / Alex"
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF1744]"
            />
          </div>

          {/* Personality Mode */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#888888] flex items-center gap-1.5 uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-[#FF1744]" /> Personality System
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  mode: 'GF' as PersonalityMode,
                  title: 'GF Mode 💖 (Default)',
                  desc: 'Warm, caring Hinglish mix ("Haan tumhara kaam ho gaya ❤️")',
                },
                {
                  mode: 'PROFESSIONAL' as PersonalityMode,
                  title: 'Professional Mode 💼',
                  desc: 'Formal English, concise, no emojis.',
                },
                {
                  mode: 'ASSISTANT' as PersonalityMode,
                  title: 'Assistant Mode 🤖',
                  desc: 'Friendly Hinglish or English, balanced & helpful.',
                },
              ].map((p) => (
                <label
                  key={p.mode}
                  onClick={() =>
                    setLocalSettings({ ...localSettings, personalityMode: p.mode })
                  }
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    localSettings.personalityMode === p.mode
                      ? 'bg-[#FF1744]/10 border-[#FF1744] text-white'
                      : 'bg-[#181818] border-[#2B2B2B] text-[#AAAAAA] hover:border-[#444444]'
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    checked={localSettings.personalityMode === p.mode}
                    onChange={() => {}}
                    className="mt-1 accent-[#FF1744]"
                  />
                  <div>
                    <div className="font-semibold text-xs text-white">{p.title}</div>
                    <div className="text-[11px] text-[#888888] mt-0.5">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#888888] flex items-center gap-1.5 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-[#FF1744]" /> AI Engine Model
            </label>
            <select
              value={localSettings.model}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, model: e.target.value })
              }
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF1744]"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#888888] flex items-center gap-1.5 uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-[#FF1744]" /> Voice Profile
            </label>
            <select
              value={localSettings.voice}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, voice: e.target.value })
              }
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF1744]"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* System Services Status */}
          <div className="space-y-2 border-t border-[#222222] pt-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#888888]">Accessibility Helper Service:</span>
              <button
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    accessibilityEnabled: !localSettings.accessibilityEnabled,
                  })
                }
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold ${
                  localSettings.accessibilityEnabled
                    ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/40'
                    : 'bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/40'
                }`}
              >
                {localSettings.accessibilityEnabled ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> ENABLED
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" /> DISABLED
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-[#888888]">Floating Overlay Orb:</span>
              <input
                type="checkbox"
                checked={localSettings.overlayOrbEnabled}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    overlayOrbEnabled: e.target.checked,
                  })
                }
                className="accent-[#FF1744] w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#141414] border-t border-[#222222] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#666666]">
            {localSettings.assistantName || 'MYRA'} v2.0
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#888888] hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-[#FF1744] to-[#D500F9] text-white rounded-xl shadow-md hover:opacity-90 transition-all"
            >
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
