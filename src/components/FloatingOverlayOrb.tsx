import React, { useState } from 'react';
import { OrbState } from '../types';
import { X, Mic } from 'lucide-react';

interface FloatingOverlayOrbProps {
  assistantName: string;
  state: OrbState;
  onClick: () => void;
  onClose: () => void;
}

export const FloatingOverlayOrb: React.FC<FloatingOverlayOrbProps> = ({
  assistantName,
  state,
  onClick,
  onClose,
}) => {
  const [pos, setPos] = useState({ x: window.innerWidth - 140, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [relPos, setRelPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setRelPos({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: Math.max(10, Math.min(window.innerWidth - 120, e.clientX - relPos.x)),
      y: Math.max(10, Math.min(window.innerHeight - 120, e.clientY - relPos.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  let stateBg = 'from-[#FF1744] to-[#B71C1C]';
  if (state === 'speaking') stateBg = 'from-[#E040FB] to-[#FF1744]';
  if (state === 'thinking') stateBg = 'from-[#40C4FF] to-[#00B0FF]';

  const displayName = assistantName || 'MYRA';

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="fixed z-50 select-none flex flex-col items-center cursor-move"
      id="floating-overlay-orb-service"
    >
      <div
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (!isDragging) onClick();
        }}
        className={`w-20 h-20 rounded-full bg-gradient-to-tr ${stateBg} p-1 shadow-[0_0_25px_rgba(255,23,68,0.7)] flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95 group`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-[#111111] border border-[#FF1744] rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Close Overlay Service"
        >
          <X className="w-3 h-3 text-[#FF1744]" />
        </button>

        <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-center">
          <Mic className="w-6 h-6 text-white animate-pulse" />
          <span className="text-[9px] font-mono font-bold tracking-widest text-white uppercase mt-0.5 max-w-[60px] truncate">
            {displayName}
          </span>
        </div>
      </div>
      <span className="mt-1 px-2 py-0.5 bg-black/80 text-[10px] font-mono text-[#FF1744] border border-[#FF1744]/30 rounded-full">
        Overlay Active
      </span>
    </div>
  );
};
