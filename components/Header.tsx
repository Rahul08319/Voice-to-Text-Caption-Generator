import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  currentYear?: number;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentYear = new Date().getFullYear(),
  hasApiKey = false,
  onOpenApiKeyModal,
}) => {
  return (
    <header className="w-full pt-6 pb-4 px-4">
      {/* Floating Dynamic Island / Apple Navigation Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2.5 rounded-full apple-glass-pill mb-6">
        {/* Brand identity */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(0,199,190,0.4)]">
            <Icon.Waveform className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">
            Caption<span className="text-cyan-400">Studio</span>
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-white/10 text-white/70 border border-white/10">
            v2.6 Apple Edition
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center space-x-2">
          {/* Engine indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300">
            <Icon.Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Gemini Live 2.5</span>
          </div>

          {/* API Key Status Pill */}
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-[11px] rounded-full border transition-all duration-200 ${
                hasApiKey
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50 animate-pulse'
              }`}
              title={hasApiKey ? 'Gemini API Key active (click to change)' : 'Click to configure Gemini API Key'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>{hasApiKey ? 'API Key Active' : 'Set API Key'}</span>
            </button>
          )}

          {/* Auto-updating year badge */}
          <span className="px-2.5 py-1 text-[11px] font-mono rounded-full bg-white/5 border border-white/10 text-white/60">
            © {currentYear}
          </span>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/Rahul08319/Voice-to-Text-Caption-Generator"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
            title="View on GitHub"
            aria-label="GitHub Repository"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Main Apple Typography Hero */}
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2.5">
          Voice to Text{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Caption Generator
          </span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-white/60 font-normal leading-relaxed">
          Ultra low-latency speech recognition, multi-speaker diarization, and real-time multilingual translation powered by Gemini.
        </p>
      </div>
    </header>
  );
};
