import React from 'react';
import { Icon } from './Icon';
import { VolumeIndicator } from './VolumeIndicator';

interface ControlsProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  statusMessage: string;
  volume: number;
}

export const Controls: React.FC<ControlsProps> = ({ isRecording, onStart, onStop, statusMessage, volume }) => {
  const ButtonIcon = isRecording ? Icon.Stop : Icon.Microphone;
  const buttonAction = isRecording ? onStop : onStart;
  const buttonClass = isRecording 
    ? "bg-red-500 hover:bg-red-600"
    : "bg-cyan-500 hover:bg-cyan-600";

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <button
        onClick={buttonAction}
        disabled={!onStart || !onStop}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50 ${buttonClass} ${isRecording ? 'focus:ring-red-400 animate-pulse' : 'focus:ring-cyan-400'}`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <ButtonIcon className="w-10 h-10" />
      </button>
      <div className="h-6 w-full max-w-xs px-4 flex items-center justify-center">
        {isRecording ? (
          <VolumeIndicator level={volume} />
        ) : (
          <p className="text-gray-400 text-center">{statusMessage}</p>
        )}
      </div>
      {isRecording && <p className="text-gray-400 h-6 text-center">{statusMessage}</p>}
    </div>
  );
};