import React from 'react';

interface VolumeIndicatorProps {
  level: number; // A value from 0 to 1+
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ level }) => {
  // Clamp the level between 0 and 1 for the width percentage
  const widthPercentage = Math.min(Math.max(level, 0), 1) * 100;

  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden" aria-hidden="true">
      <div
        className="h-full bg-cyan-400 transition-all duration-75 ease-out"
        style={{ width: `${widthPercentage}%` }}
      />
    </div>
  );
};