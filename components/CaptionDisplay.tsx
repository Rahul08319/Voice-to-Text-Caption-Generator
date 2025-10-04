import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { Caption } from '../types';

interface CaptionDisplayProps {
  history: Caption[];
  currentCaption: Caption | null;
  onDownload: () => void;
}

export const CaptionDisplay: React.FC<CaptionDisplayProps> = ({ history, currentCaption, onDownload }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentCaption]);

  const hasContent = history.length > 0 || currentCaption;

  return (
    <div ref={scrollRef} className="relative flex-grow p-6 overflow-y-auto">
      {hasContent && (
        <button
          onClick={onDownload}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 z-10"
          aria-label="Download captions"
          title="Download captions"
        >
          <Icon.Download className="w-6 h-6" />
        </button>
      )}
       {!hasContent && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-lg">Captions will appear here...</p>
        </div>
      )}
      {history.map((caption, index) => (
        <p key={index} className="mb-2 text-2xl leading-relaxed text-gray-200">
          <span className="font-bold text-cyan-400">Speaker {caption.speakerId}: </span>
          {caption.text}
        </p>
      ))}
      {currentCaption && (
        <p className="text-2xl leading-relaxed text-gray-400">
          <span className="font-bold text-cyan-300">Speaker {currentCaption.speakerId}: </span>
          {currentCaption.text}
        </p>
      )}
    </div>
  );
};