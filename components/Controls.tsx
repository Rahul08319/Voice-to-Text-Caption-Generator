import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { VolumeIndicator } from './VolumeIndicator';

interface ControlsProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  statusMessage: string;
  volume: number;
}

export const Controls: React.FC<ControlsProps> = ({
  isRecording,
  onStart,
  onStop,
  statusMessage,
  volume,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live elapsed timer while recording
  useEffect(() => {
    let interval: number | undefined;
    if (isRecording) {
      setElapsedSeconds(0);
      interval = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* Dynamic Status Capsule */}
      <div className="w-full max-w-md px-4 py-2 rounded-full apple-glass-pill flex items-center justify-between text-xs transition-all duration-300">
        <div className="flex items-center space-x-2">
          {/* Status Dot */}
          <span className="relative flex h-2.5 w-2.5">
            {isRecording ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            )}
          </span>
          <span className="font-medium text-white/80 tracking-wide">{statusMessage}</span>
        </div>

        {/* Elapsed Timer when recording */}
        {isRecording && (
          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-rose-300 font-semibold bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        )}
      </div>

      {/* Main Apple Microphone / Stop Action Area */}
      <div className="relative flex items-center justify-center my-2">
        {/* Concentric sound wave radar rings when recording */}
        {isRecording && (
          <>
            <div className="absolute w-28 h-28 rounded-full border border-rose-500/30 animate-ping opacity-30 pointer-events-none"></div>
            <div className="absolute w-36 h-36 rounded-full border border-rose-400/20 animate-pulse opacity-40 pointer-events-none"></div>
          </>
        )}

        {/* Apple Primary Action Button */}
        <button
          onClick={handleToggle}
          disabled={!onStart || !onStop}
          className={`group relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center text-white transition-all duration-300 ease-out focus:outline-none focus:ring-4 ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.45)] focus:ring-rose-400/40 hover:scale-105 active:scale-95'
              : 'bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 shadow-[0_0_35px_rgba(0,199,190,0.35)] focus:ring-cyan-400/40 hover:scale-105 active:scale-95'
          }`}
          aria-label={isRecording ? 'Stop recording captions' : 'Start recording captions'}
          title={isRecording ? 'Stop Recording (Space)' : 'Start Recording (Space)'}
        >
          {/* Specular Highlight Arc overlay simulating 3D Glass */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute inset-[1px] rounded-full border border-white/20 pointer-events-none"></div>

          {isRecording ? (
            <Icon.Stop className="w-8 h-8 text-white drop-shadow-md transition-transform group-hover:scale-110" />
          ) : (
            <Icon.Microphone className="w-8 h-8 text-white drop-shadow-md transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* Live Equalizer Bar */}
      <div className="w-full max-w-sm px-4">
        {isRecording ? (
          <VolumeIndicator level={volume} />
        ) : (
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-white/40 font-normal">
            <Icon.Keyboard className="w-3.5 h-3.5 text-white/30" />
            <span>Shortcut: Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/60 border border-white/10">Space</kbd> to toggle microphone</span>
          </div>
        )}
      </div>
    </div>
  );
};