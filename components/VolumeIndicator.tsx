import React, { useMemo } from 'react';

interface VolumeIndicatorProps {
  level: number; // Volume amplitude level (0 to 1+)
  barsCount?: number;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ level, barsCount = 14 }) => {
  // Clamp base level
  const clampedLevel = Math.min(Math.max(level, 0), 1.5);
  const normalizedPercentage = Math.min(Math.round(clampedLevel * 100), 100);

  // Generate dynamic wave heights based on sine harmonics + noise
  const bars = useMemo(() => {
    return Array.from({ length: barsCount }, (_, index) => {
      // Bell curve factor centered around middle bars
      const centerFactor = 1 - Math.abs((index - (barsCount - 1) / 2) / ((barsCount - 1) / 2)) * 0.45;
      // Multi-frequency harmonic variation
      const wave = Math.sin((index * 1.3) + (clampedLevel * 4));
      const variation = 0.6 + 0.4 * wave;
      
      const heightMultiplier = Math.max(0.12, clampedLevel * centerFactor * variation);
      const clampedHeight = Math.min(Math.max(heightMultiplier * 100, 12), 100);
      return clampedHeight;
    });
  }, [clampedLevel, barsCount]);

  return (
    <div className="w-full flex items-center justify-between gap-3 px-1 py-1" aria-label="Audio level meter">
      {/* Soundwave frequency bars */}
      <div className="flex-1 flex items-center justify-center gap-1.5 h-8">
        {bars.map((height, i) => {
          // Color gradation: Cyan -> Azure Blue -> Purple
          const isHigh = height > 65;
          const isMid = height > 35;
          const barColor = isHigh 
            ? 'bg-gradient-to-t from-cyan-400 to-indigo-400 shadow-[0_0_8px_rgba(0,199,190,0.5)]' 
            : isMid 
            ? 'bg-gradient-to-t from-cyan-500 to-cyan-400' 
            : 'bg-white/20';

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-100 ease-out ${barColor}`}
              style={{
                height: `${height}%`,
                minHeight: '4px',
                transform: `scaleY(${Math.max(0.2, height / 100)})`,
                transformOrigin: 'center',
              }}
            />
          );
        })}
      </div>

      {/* Subtle dB percentage indicator */}
      <span className="text-[11px] font-mono tracking-wider text-cyan-400/80 shrink-0 font-medium w-10 text-right">
        {normalizedPercentage}%
      </span>
    </div>
  );
};