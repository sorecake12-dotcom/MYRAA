import React, { useState, useEffect, useRef } from 'react';
import {
  MyraSettings,
  DeviceState,
  OrbState,
  ChatMessage,
  AppCommand,
  HistoryMessageEntry,
  CommandLogEntry,
} from './types';
import { parseVoiceCommand } from './utils/commandParser';
import { AudioEngine } from './utils/audioEngine';
import {
  saveHistoryMessage,
  saveCommandLog,
  getHistoryMessages,
} from './utils/historyStorage';
import { TopBar } from './components/TopBar';
import { OrbAnimationView } from './components/OrbAnimationView';
import { WaveformView } from './components/WaveformView';
import { ChatList } from './components/ChatList';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { FloatingOverlayOrb } from './components/FloatingOverlayOrb';
import { Mic, Send, VolumeX } from 'lucide-react';

const DEFAULT_SETTINGS: MyraSettings = {
  apiKey: '',
  userName: 'Alex',
  assistantName: 'MYRA',
  personalityMode: 'GF',
  model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
  voice: 'Aoede',
  accessibilityEnabled: true,
  overlayOrbEnabled: false,
};

const DEFAULT_DEVICE_STATE: DeviceState = {
  currentApp: null,
  flashlightOn: false,
  wifiOn: true,
  bluetoothOn: true,
  volume: 75,
  battery: 92,
  ramUsage: 42,
  recentNotification: null,
};

export function App() {
  const [settings, setSettings] = useState<MyraSettings>(() => {
    const saved = localStorage.getItem('myra_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          assistantName: parsed.assistantName || 'MYRA',
        };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [deviceState, setDeviceState] = useState<DeviceState>(DEFAULT_DEVICE_STATE);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [amplitude, setAmplitude] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Tap karke bolo 💬');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Load recent conversation messages from persistent history DB
    const savedMsgs = getHistoryMessages();
    if (savedMsgs.length > 0) {
      return savedMsgs.slice(-30).map((m) => ({
        id: m.id,
        text: m.content,
        isUser: m.speaker === 'User',
        timestamp: m.timestamp,
        commandExecuted: m.commandExecuted,
        inputType: m.inputType,
        sessionId: m.sessionId,
      }));
    }
    return [];
  });
  const [inputText, setInputText] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const sessionIdRef = useRef<string>(`session_${Date.now()}`);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Update Page Title dynamically based on assistantName
  useEffect(() => {
    const name = settings.assistantName || 'MYRA';
    document.title = `${name} — AI Companion`;
  }, [settings.assistantName]);

  // Initialize AudioEngine
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    audioEngineRef.current.setAmplitudeListener((amp) => {
      if (typeof amp === 'number') {
        setAmplitude(amp);
      }
    });

    audioEngineRef.current.setSpeakingListeners(
      () => setOrbState('speaking'),
      () => setOrbState('idle')
    );

    return () => {
      audioEngineRef.current?.stopPlayback();
      audioEngineRef.current?.stopSpeechRecognition();
    };
  }, []);

  // Save Settings to Local Storage
  const handleSaveSettings = (newSettings: MyraSettings) => {
    setSettings(newSettings);
    localStorage.setItem('myra_settings', JSON.stringify(newSettings));
  };

  // Initial Welcome Greeting from Assistant (if no prior conversation loaded)
  useEffect(() => {
    if (messages.length > 0) return;

    const timer = setTimeout(() => {
      const assistantName = settings.assistantName || 'MYRA';
      let greeting = `Hey ${settings.userName}! Main ${assistantName} hoon. Aaj kya help chahiye? ❤️`;
      if (settings.personalityMode === 'PROFESSIONAL') {
        greeting = `Good day ${settings.userName}. ${assistantName} is online and ready to assist you.`;
      } else if (settings.personalityMode === 'ASSISTANT') {
        greeting = `Hello ${settings.userName}! Main ${assistantName} hoon. Main aapki kya help kar sakti hoon?`;
      }

      addAssistantMessage(greeting);
      audioEngineRef.current?.speakText(greeting, settings.voice);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const addAssistantMessage = (text: string, commandExecuted?: string) => {
    const timestamp = Date.now();
    const id = `msg_ast_${timestamp}`;
    const newMsg: ChatMessage = {
      id,
      text,
      isUser: false,
      timestamp,
      commandExecuted,
      inputType: 'text',
      sessionId: sessionIdRef.current,
    };

    setMessages((prev) => {
      if (prev.length > 0 && !prev[prev.length - 1].isUser && prev[prev.length - 1].text === text) {
        return prev;
      }
      return [...prev, newMsg];
    });

    // Save to Room persistent storage
    const historyEntry: HistoryMessageEntry = {
      id,
      sessionId: sessionIdRef.current,
      timestamp,
      speaker: 'Assistant',
      content: text,
      inputType: 'voice',
      commandExecuted,
    };
    saveHistoryMessage(historyEntry);
  };

  const addUserMessage = (text: string, inputType: 'voice' | 'text' = 'text') => {
    const timestamp = Date.now();
    const id = `msg_usr_${timestamp}`;
    const newMsg: ChatMessage = {
      id,
      text,
      isUser: true,
      timestamp,
      inputType,
      sessionId: sessionIdRef.current,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Save to Room persistent storage
    const historyEntry: HistoryMessageEntry = {
      id,
      sessionId: sessionIdRef.current,
      timestamp,
      speaker: 'User',
      content: text,
      inputType,
    };
    saveHistoryMessage(historyEntry);
  };

  // Command Execution Router with Log Recording
  const executeCommand = (cmd: AppCommand): { notice: string; success: boolean; duration: number } => {
    const startTime = performance.now();
    let resultNotice = '';
    let success = true;
    let errorMessage = '';

    try {
      switch (cmd.type) {
        case 'OPEN_APP': {
          const appName = cmd.params.appName || 'App';
          setDeviceState((prev) => ({ ...prev, currentApp: appName }));
          resultNotice = `App Opened: ${appName.toUpperCase()}`;
          break;
        }

        case 'CLOSE_APP': {
          setDeviceState((prev) => ({ ...prev, currentApp: null }));
          resultNotice = `Returned to Home Screen`;
          break;
        }

        case 'FLASHLIGHT_ON': {
          setDeviceState((prev) => ({ ...prev, flashlightOn: true }));
          resultNotice = `Flashlight Turned ON`;
          break;
        }

        case 'FLASHLIGHT_OFF': {
          setDeviceState((prev) => ({ ...prev, flashlightOn: false }));
          resultNotice = `Flashlight Turned OFF`;
          break;
        }

        case 'VOLUME_UP': {
          setDeviceState((prev) => ({ ...prev, volume: Math.min(100, prev.volume + 15) }));
          resultNotice = `Volume Increased`;
          break;
        }

        case 'VOLUME_DOWN': {
          setDeviceState((prev) => ({ ...prev, volume: Math.max(0, prev.volume - 15) }));
          resultNotice = `Volume Decreased`;
          break;
        }

        case 'WIFI_ON': {
          setDeviceState((prev) => ({ ...prev, wifiOn: true }));
          resultNotice = `Wi-Fi Turned ON`;
          break;
        }

        case 'WIFI_OFF': {
          setDeviceState((prev) => ({ ...prev, wifiOn: false }));
          resultNotice = `Wi-Fi Turned OFF`;
          break;
        }

        case 'BLUETOOTH_ON': {
          setDeviceState((prev) => ({ ...prev, bluetoothOn: true }));
          resultNotice = `Bluetooth Turned ON`;
          break;
        }

        case 'BLUETOOTH_OFF': {
          setDeviceState((prev) => ({ ...prev, bluetoothOn: false }));
          resultNotice = `Bluetooth Turned OFF`;
          break;
        }

        default:
          success = false;
          errorMessage = 'Command not recognized';
          break;
      }
    } catch (err: any) {
      success = false;
      errorMessage = err?.message || 'Execution failed';
    }

    const duration = Math.round(performance.now() - startTime);

    // Save Command Log to Room Storage
    const logEntry: CommandLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      receivedInput: cmd.rawInput,
      parsedCommand: `${cmd.type}${
        cmd.params.appName ? `(${cmd.params.appName.toUpperCase()})` : ''
      }`,
      actionExecuted: resultNotice || 'Command execution attempted',
      status: success ? 'SUCCESS' : 'FAILED',
      executionDurationMs: duration,
      errorMessage: errorMessage || undefined,
    };
    saveCommandLog(logEntry);

    return { notice: resultNotice, success, duration };
  };

  // Process User Input (Voice or Text)
  const handleProcessInput = async (text: string, inputType: 'voice' | 'text' = 'text') => {
    if (!text.trim()) return;

    audioEngineRef.current?.initAudioContext();
    addUserMessage(text, inputType);
    setStatusText('Thinking...');
    setOrbState('thinking');

    // Parse for local Device Controls
    const command = parseVoiceCommand(text);
    let commandNotice = '';

    if (command) {
      const res = executeCommand(command);
      commandNotice = res.notice;
    }

    // Call Backend Gemini AI Engine
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (settings.apiKey) {
        headers['x-gemini-api-key'] = settings.apiKey;
      }

      const res = await fetch('/api/myra/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          userName: settings.userName,
          assistantName: settings.assistantName,
          personalityMode: settings.personalityMode,
          model: settings.model,
          apiKey: settings.apiKey,
          deviceState: deviceState,
        }),
      });

      const data = await res.json();
      const reply = data.reply || `Haan ${settings.userName}! Ho gaya ❤️`;

      addAssistantMessage(reply, commandNotice || undefined);
      setStatusText('Bol rahi hoon...');
      setOrbState('speaking');

      // Speak response aloud
      audioEngineRef.current?.speakText(reply, settings.voice, () => {
        setStatusText('Tap karke bolo 💬');
        setOrbState('idle');
      });
    } catch (err) {
      const fallbackReply = commandNotice
        ? `Done ${settings.userName}! ${commandNotice}`
        : `Haan ${settings.userName}, main sun rahi hoon! ❤️`;
      addAssistantMessage(fallbackReply, commandNotice || undefined);
      setStatusText('Bol rahi hoon...');
      setOrbState('speaking');

      audioEngineRef.current?.speakText(fallbackReply, settings.voice, () => {
        setStatusText('Tap karke bolo 💬');
        setOrbState('idle');
      });
    }
  };

  // Mic Button Handler
  const handleMicClick = () => {
    if (audioEngineRef.current?.getIsSpeaking()) {
      // Interrupt speaking
      audioEngineRef.current.stopPlayback();
      setStatusText('Tap karke bolo 💬');
      setOrbState('idle');
      return;
    }

    if (orbState === 'listening') {
      audioEngineRef.current?.stopSpeechRecognition();
      setStatusText('Tap karke bolo 💬');
      setOrbState('idle');
      return;
    }

    audioEngineRef.current?.initAudioContext();
    setStatusText('Sun rahi hoon... 🎙️');
    setOrbState('listening');

    audioEngineRef.current?.startSpeechRecognition(
      (transcript, isFinal) => {
        if (isFinal) {
          setStatusText(`Recorded: "${transcript}"`);
          handleProcessInput(transcript, 'voice');
        } else {
          setStatusText(`"${transcript}"...`);
        }
      },
      (err) => {
        setStatusText('Mic Error or Timed out. Type message below 👇');
        setOrbState('idle');
      }
    );
  };

  const currentAssistantName = settings.assistantName || 'MYRA';

  return (
    <div className="relative w-screen h-screen bg-[#050505] text-[#EEEEEE] overflow-hidden flex flex-col justify-between select-none">
      {/* Background Radial Glow Mesh */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FF1744]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D500F9]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Red Screen Activation Overlay (fades in when Assistant is listening/speaking) */}
      <div
        className="absolute inset-0 bg-[#FF1744] pointer-events-none transition-opacity duration-500 z-10"
        style={{
          opacity: orbState === 'listening' || orbState === 'speaking' ? 0.08 : 0,
        }}
      />

      {/* Top Bar Header */}
      <TopBar
        assistantName={currentAssistantName}
        deviceState={deviceState}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

      {/* Center Stage: Orb + Waveform + Status */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-2 space-y-3">
        {/* Animated Custom Orb */}
        <OrbAnimationView
          state={orbState}
          amplitude={amplitude}
          onClick={handleMicClick}
          size={250}
        />

        {/* Dynamic Waveform Visualizer */}
        <WaveformView amplitude={amplitude} active={orbState !== 'idle'} />

        {/* Status Text */}
        <p className="text-xs font-mono tracking-wider text-[#888888] animate-pulse">
          {statusText}
        </p>

        {/* Quick Voice Trigger Shortcuts Pill */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md pt-1">
          {[
            'YouTube kholo',
            'torch on karo',
            'volume up',
            'wifi off',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleProcessInput(promptText, 'voice')}
              className="px-2.5 py-1 bg-[#111111] border border-[#222222] hover:border-[#FF1744]/50 rounded-full text-[11px] font-mono text-[#888888] hover:text-white transition-all"
            >
              💬 "{promptText}"
            </button>
          ))}
        </div>
      </main>

      {/* Chat Recycler History View */}
      <div className="relative z-20 w-full max-w-2xl mx-auto h-48 flex flex-col">
        <ChatList
          messages={messages}
          userName={settings.userName}
          assistantName={currentAssistantName}
        />
      </div>

      {/* Bottom Controls: Mic Button & Keyboard Input */}
      <footer className="relative z-20 w-full max-w-xl mx-auto pb-5 px-4 flex flex-col items-center gap-3">
        {/* Main Mic Action Button */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={handleMicClick}
            className={`w-18 h-18 rounded-full border-2 flex items-center justify-center transition-all shadow-xl ${
              orbState === 'listening'
                ? 'bg-[#FF1744] border-white text-white scale-110 shadow-[0_0_30px_rgba(255,23,68,0.8)] animate-pulse'
                : orbState === 'speaking'
                ? 'bg-[#E040FB] border-white text-white shadow-[0_0_30px_rgba(224,64,251,0.8)]'
                : 'bg-[#111111] border-[#FF1744] text-[#FF1744] hover:bg-[#FF1744] hover:text-white'
            }`}
            id="main-mic-button"
            title={`Tap to Speak to ${currentAssistantName} (Tap while speaking to stop)`}
          >
            {orbState === 'listening' ? (
              <Mic className="w-8 h-8 animate-bounce" />
            ) : orbState === 'speaking' ? (
              <VolumeX className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        <span className="text-[10px] font-mono text-[#555555]">
          Tap mic to speak • Tap while speaking to stop
        </span>

        {/* Text Message Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputText) {
              handleProcessInput(inputText, 'text');
              setInputText('');
            }
          }}
          className="w-full flex items-center gap-2 bg-[#111111] border border-[#222222] focus-within:border-[#FF1744] rounded-2xl px-3.5 py-2 transition-all shadow-inner"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type a message or command to ${currentAssistantName}...`}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#555555] focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-[#FF1744] disabled:bg-[#333333] text-white transition-all hover:scale-105 active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

      {/* Floating Overlay Orb Service (Draggable desktop widget) */}
      {settings.overlayOrbEnabled && (
        <FloatingOverlayOrb
          assistantName={currentAssistantName}
          state={orbState}
          onClick={handleMicClick}
          onClose={() => handleSaveSettings({ ...settings, overlayOrbEnabled: false })}
        />
      )}

      {/* Settings Modal Activity */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* History & Command Logs Modal */}
      {showHistory && (
        <HistoryModal
          assistantName={currentAssistantName}
          onClose={() => setShowHistory(false)}
          onHistoryCleared={() => setMessages([])}
        />
      )}
    </div>
  );
}

export default App;
