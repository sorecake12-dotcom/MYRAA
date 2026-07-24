import React, { useState, useEffect } from 'react';
import { Settings, Battery, Cpu, History } from 'lucide-react';
import { DeviceState } from '../types';

interface TopBarProps {
  assistantName: string;
  deviceState: DeviceState;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  assistantName,
  deviceState,
  onOpenSettings,
  onOpenHistory,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${mins}:${secs}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="w-full pt-4 pb-2 px-4 flex items-center justify-between border-b border-[#222222] bg-[#050505]/90 backdrop-blur-md z-30 select-none"
      id="top-bar-header"
    >
      {/* Left: Battery & RAM */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-1 text-[#FF6D6D]">
          <Battery className="w-3.5 h-3.5 text-[#FF1744]" />
          <span>{deviceState.battery}%</span>
        </div>
        <div className="flex items-center gap-1 text-[#888888] hidden sm:flex">
          <Cpu className="w-3.5 h-3.5 text-[#888888]" />
          <span>{deviceState.ramUsage}% RAM</span>
        </div>
      </div>

      {/* Center: Dynamic Assistant Name Title */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF1744] animate-pulse" />
          <h1 className="text-lg font-black tracking-[0.25em] text-[#FF1744] uppercase font-sans">
            {assistantName || 'MYRA'}
          </h1>
        </div>
        <span className="text-[10px] font-mono tracking-widest text-[#888888] uppercase">
          AI ASSISTANT
        </span>
      </div>

      {/* Right: Clock + History + Settings Buttons */}
      <div className="flex items-center gap-2 font-mono">
        <span className="text-xs text-[#FF1744] hidden sm:inline mr-1">
          {timeStr}
        </span>

        <button
          onClick={onOpenHistory}
          title="Conversation History & Command Logs"
          className="p-2 rounded-xl bg-[#111111] border border-[#222222] text-[#888888] hover:text-[#FF1744] hover:border-[#FF1744]/40 transition-all flex items-center gap-1.5"
          id="open-history-btn"
        >
          <History className="w-4 h-4 text-[#FF1744]" />
          <span className="text-xs hidden md:inline font-mono">History</span>
        </button>

        <button
          onClick={onOpenSettings}
          title={`${assistantName || 'Assistant'} Settings`}
          className="p-2 rounded-xl bg-[#111111] border border-[#222222] text-[#888888] hover:text-[#FF1744] hover:border-[#FF1744]/40 transition-all flex items-center gap-1.5"
          id="open-settings-btn"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs hidden md:inline font-mono">Settings</span>
        </button>
      </div>
    </header>
  );
};
