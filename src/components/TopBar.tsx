import React, { useState, useEffect } from 'react';
import {
  Settings,
  Battery,
  BatteryWarning,
  BatteryCharging,
  Cpu,
  History,
  AlertTriangle,
  Zap,
  RefreshCw,
  X,
} from 'lucide-react';
import { DeviceState } from '../types';

interface TopBarProps {
  assistantName: string;
  deviceState: DeviceState;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onCheckBattery: () => void;
  onSimulateBatteryChange: (newLevel: number) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  assistantName,
  deviceState,
  onOpenSettings,
  onOpenHistory,
  onCheckBattery,
  onSimulateBatteryChange,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [showBatteryPopover, setShowBatteryPopover] = useState<boolean>(false);

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

  const isLowBattery = deviceState.battery <= 15;

  // Determine battery indicator color & icon
  const getBatteryColorClass = () => {
    if (deviceState.battery <= 15) return 'text-[#FF1744] font-bold animate-pulse';
    if (deviceState.battery <= 35) return 'text-[#FFC107]';
    return 'text-[#00E676]';
  };

  return (
    <header
      className="w-full pt-4 pb-2 px-4 flex items-center justify-between border-b border-[#222222] bg-[#050505]/90 backdrop-blur-md z-30 select-none relative"
      id="top-bar-header"
    >
      {/* Left: Battery & RAM */}
      <div className="flex items-center gap-3 text-xs font-mono relative">
        <button
          onClick={() => setShowBatteryPopover(!showBatteryPopover)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#111111] border transition-all cursor-pointer ${
            isLowBattery
              ? 'border-[#FF1744] bg-[#FF1744]/10 shadow-[0_0_10px_rgba(255,23,68,0.4)]'
              : 'border-[#222222] hover:border-[#444444]'
          }`}
          title="Click to check or simulate battery level"
          id="battery-indicator-btn"
        >
          {isLowBattery ? (
            <BatteryWarning className="w-4 h-4 text-[#FF1744] animate-bounce" />
          ) : (
            <Battery className={`w-3.5 h-3.5 ${getBatteryColorClass()}`} />
          )}
          <span className={getBatteryColorClass()}>{deviceState.battery}%</span>
          {isLowBattery && (
            <span className="text-[10px] bg-[#FF1744] text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ml-1">
              LOW
            </span>
          )}
        </button>

        <div className="flex items-center gap-1 text-[#888888] hidden sm:flex">
          <Cpu className="w-3.5 h-3.5 text-[#888888]" />
          <span>{deviceState.ramUsage}% RAM</span>
        </div>

        {/* Battery Control Popover */}
        {showBatteryPopover && (
          <div className="absolute top-10 left-0 w-72 bg-[#121212] border border-[#333333] rounded-2xl p-4 shadow-2xl z-50 font-mono text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <Zap className="w-4 h-4 text-[#FF1744]" />
                <span>Battery Monitor</span>
              </div>
              <button
                onClick={() => setShowBatteryPopover(false)}
                className="text-[#888888] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Display */}
            <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Current Level:</span>
                <span className={`font-bold ${getBatteryColorClass()}`}>
                  {deviceState.battery}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#222222] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isLowBattery
                      ? 'bg-[#FF1744]'
                      : deviceState.battery <= 35
                      ? 'bg-[#FFC107]'
                      : 'bg-[#00E676]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, deviceState.battery))}%` }}
                />
              </div>

              <div className="text-[10px] text-[#666666] pt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#FF1744]" />
                Threshold: Assistant alerts below 15%
              </div>
            </div>

            {/* Check Battery Level Button */}
            <button
              onClick={() => {
                onCheckBattery();
                setShowBatteryPopover(false);
              }}
              className="w-full py-2 bg-[#FF1744] hover:bg-[#FF1744]/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Check Battery Level
            </button>

            {/* Simulate Slider */}
            <div className="space-y-1.5 pt-1 border-t border-[#222222]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#888888]">Simulate Battery Level:</span>
                <span className="text-white font-bold">{deviceState.battery}%</span>
              </div>

              <input
                type="range"
                min="1"
                max="100"
                value={deviceState.battery}
                onChange={(e) => onSimulateBatteryChange(Number(e.target.value))}
                className="w-full accent-[#FF1744] cursor-pointer"
              />

              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => onSimulateBatteryChange(10)}
                  className="flex-1 py-1 rounded-lg bg-[#FF1744]/20 border border-[#FF1744] text-[#FF1744] text-[10px] font-bold hover:bg-[#FF1744]/30"
                >
                  ⚡ 10% (Alert)
                </button>
                <button
                  onClick={() => onSimulateBatteryChange(50)}
                  className="flex-1 py-1 rounded-lg bg-[#222222] border border-[#333333] text-[#CCCCCC] text-[10px] hover:text-white"
                >
                  50%
                </button>
                <button
                  onClick={() => onSimulateBatteryChange(100)}
                  className="flex-1 py-1 rounded-lg bg-[#222222] border border-[#333333] text-[#CCCCCC] text-[10px] hover:text-white"
                >
                  100%
                </button>
              </div>
            </div>
          </div>
        )}
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
