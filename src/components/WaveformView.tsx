import React, { useEffect, useState } from 'react';

interface WaveformViewProps {
  amplitude: number; // 0.0 to 1.0
  active: boolean;
  barCount?: number;
}

export const WaveformView: React.FC<WaveformViewProps> = ({
  amplitude,
  active,
  barCount = 20,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array(barCount).fill(10)
  );

  useEffect(() => {
    let animId: number;

    const updateHeights = () => {
      setBarHeights((prev) =>
        prev.map((current, i) => {
          if (!active) {
            const target = 6 + Math.sin(Date.now() / 400 + i) * 3;
            return current + (target - current) * 0.15;
          }
          // Center bars have higher amplitude bias
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const weight = 1 - distFromCenter * 0.5;
          const randomFactor = Math.random() * 0.4 + 0.6;
          const target = Math.max(
            8,
            amplitude * 90 * weight * randomFactor + Math.sin(Date.now() / 100 + i) * 6
          );

          return current + (target - current) * 0.3; // lerp transition
        })
      );

      animId = requestAnimationFrame(updateHeights);
    };

    animId = requestAnimationFrame(updateHeights);
    return () => cancelAnimationFrame(animId);
  }, [amplitude, active, barCount]);

  return (
    <div
      className="flex items-center justify-center gap-[3px] h-[40px] px-4 py-1"
      id="waveform-view"
    >
      {barHeights.map((h, index) => {
        const opacity = Math.min(1, 0.45 + (h / 90) * 0.55);
        return (
          <div
            key={index}
            className="w-[3px] rounded-full transition-all duration-75 bg-[#FF1744]"
            style={{
              height: `${Math.min(38, Math.max(4, h))}px`,
              opacity: opacity,
              boxShadow: active ? `0 0 6px rgba(255, 23, 68, ${opacity})` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};
