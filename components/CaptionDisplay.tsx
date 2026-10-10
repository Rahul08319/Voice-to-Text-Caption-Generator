import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Icon } from './Icon';
import { Caption, ExportFormat } from '../types';

interface CaptionDisplayProps {
  history: Caption[];
  currentCaption: Caption | null;
  onDownload: (format?: ExportFormat) => void;
  onClear?: () => void;
  isRecording?: boolean;
}

// Apple color palette for distinct speakers
const SPEAKER_STYLES: Record<number, { border: string; bg: string; badge: string; text: string; glow: string }> = {
  1: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-950/20',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_15px_rgba(0,199,190,0.15)]',
  },
  2: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-950/20',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    text: 'text-indigo-400',
    glow: 'shadow-[0_0_15px_rgba(94,92,230,0.15)]',
  },
  3: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/20',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_15px_rgba(48,209,88,0.15)]',
  },
  4: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/20',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_15px_rgba(255,159,10,0.15)]',
  },
  5: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-950/20',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_15px_rgba(255,55,95,0.15)]',
  },
};

export const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
  history,
  currentCaption,
  onDownload,
  onClear,
  isRecording = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Auto-scroll to bottom on incoming text
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history, currentCaption]);

  const allCaptions = useMemo(() => {
    const list = [...history];
    if (currentCaption && currentCaption.text.trim()) {
      list.push(currentCaption);
    }
    return list;
  }, [history, currentCaption]);

  const filteredCaptions = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(
      (c) => c.text.toLowerCase().includes(q) || `speaker ${c.speakerId}`.toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  const wordCount = useMemo(() => {
    return allCaptions.reduce((acc, c) => acc + (c.text.trim() ? c.text.trim().split(/\s+/).length : 0), 0);
  }, [allCaptions]);

  const handleCopyAll = async () => {
    const fullText = allCaptions
      .map((c) => `[${c.timestamp || 'Live'}] Speaker ${c.speakerId}: ${c.text}`)
      .join('\n\n');
    if (!fullText.trim()) return;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopySingle = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error('Failed to copy single caption', err);
    }
  };

  const fontSizeClasses = {
    sm: 'text-sm sm:text-base leading-relaxed',
    base: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-relaxed',
    xl: 'text-xl sm:text-2xl leading-relaxed',
  }[fontSize];

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden relative">
      {/* Top Glass Utility Toolbar */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between flex-wrap gap-2.5 z-20">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Captions</span>
          <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-white/10 text-white/80 border border-white/10">
            {allCaptions.length} {allCaptions.length === 1 ? 'utterance' : 'utterances'}
          </span>
          {wordCount > 0 && (
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono rounded-full bg-white/5 text-white/50 border border-white/5">
              {wordCount} words
            </span>
          )}
        </div>

        {/* Toolbar action buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Font scale buttons */}
          <div className="hidden sm:flex items-center rounded-lg bg-white/[0.05] p-0.5 border border-white/10">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                fontSize === 'sm' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'
              }`}
              title="Small text"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                fontSize === 'base' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'
              }`}
              title="Default text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                fontSize === 'lg' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/80'
              }`}
              title="Large text"
            >
              A+
            </button>
          </div>

          {/* Search bar when history exists */}
          {history.length > 2 && (
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 text-xs text-white rounded-lg px-2.5 py-1 w-28 focus:w-40 transition-all duration-200 focus:outline-none focus:border-cyan-400/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1 text-white/40 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {allCaptions.length > 0 && (
            <>
              {/* Copy All */}
              <button
                onClick={handleCopyAll}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white transition-all duration-200"
                title="Copy entire transcript"
              >
                {copiedAll ? (
                  <>
                    <Icon.Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Icon.Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy All</span>
                  </>
                )}
              </button>

              {/* Export menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white transition-all duration-200"
                  title="Export options"
                >
                  <Icon.Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="text-[10px] text-white/40 ml-0.5">▼</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-36 rounded-xl apple-glass border border-white/10 shadow-2xl p-1 z-30 flex flex-col text-xs">
                    <button
                      onClick={() => {
                        onDownload('txt');
                        setShowExportMenu(false);
                      }}
                      className="px-2.5 py-1.5 text-left rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      Plain Text (.txt)
                    </button>
                    <button
                      onClick={() => {
                        onDownload('srt');
                        setShowExportMenu(false);
                      }}
                      className="px-2.5 py-1.5 text-left rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      Subtitles (.srt)
                    </button>
                    <button
                      onClick={() => {
                        onDownload('vtt');
                        setShowExportMenu(false);
                      }}
                      className="px-2.5 py-1.5 text-left rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      WebVTT (.vtt)
                    </button>
                    <button
                      onClick={() => {
                        onDownload('json');
                        setShowExportMenu(false);
                      }}
                      className="px-2.5 py-1.5 text-left rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      JSON Dataset (.json)
                    </button>
                  </div>
                )}
              </div>

              {/* Clear History */}
              {onClear && (
                <button
                  onClick={onClear}
                  className="p-1 text-xs rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-white/40 hover:text-red-300 border border-white/5 hover:border-red-500/30 transition-all duration-200"
                  title="Clear transcript"
                  aria-label="Clear transcript"
                >
                  <Icon.Trash className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Transcript Scroll View */}
      <div
        ref={scrollRef}
        className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-3.5 relative min-h-[300px] max-h-[500px]"
      >
        {/* Empty State */}
        {allCaptions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center px-4">
            <div className="w-16 h-16 rounded-2xl apple-glass-card flex items-center justify-center mb-4 text-cyan-400 shadow-lg border border-white/10">
              <Icon.Waveform className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white/90 mb-1">
              {isRecording ? 'Listening for speech...' : 'Ready for Audio Capture'}
            </h3>
            <p className="text-xs sm:text-sm text-white/50 max-w-sm mb-4 leading-relaxed">
              {isRecording
                ? 'Speak clearly into your microphone. Words and speaker turns will appear here in real-time.'
                : 'Click the record button below or press Spacebar to start generating instant live captions.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/40">
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                🎙️ Gemini 2.5 Live
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                🌐 Multilingual
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                👥 Diarization
              </span>
            </div>
          </div>
        )}

        {/* Completed History Captions */}
        {filteredCaptions.map((caption, index) => {
          const style = SPEAKER_STYLES[caption.speakerId] || SPEAKER_STYLES[1];
          const itemKey = caption.id || `hist-${index}`;

          return (
            <div
              key={itemKey}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 apple-glass-card ${style.border} ${style.bg} hover:border-white/20`}
            >
              {/* Header inside bubble */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${style.badge} tracking-wide`}
                  >
                    Speaker {caption.speakerId}
                  </span>
                  {caption.timestamp && (
                    <span className="text-[11px] font-mono text-white/40">{caption.timestamp}</span>
                  )}
                </div>

                {/* Micro copy button */}
                <button
                  onClick={() => handleCopySingle(caption.text, itemKey)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150"
                  title="Copy this sentence"
                >
                  {copiedId === itemKey ? (
                    <Icon.Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Icon.Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Caption Content */}
              <p className={`${fontSizeClasses} text-white/90 font-normal tracking-normal`}>
                {caption.text}
              </p>
            </div>
          );
        })}

        {/* Current Active Streaming Caption */}
        {currentCaption && currentCaption.text.trim() && (
          <div
            className={`p-4 rounded-2xl border border-cyan-400/40 bg-cyan-950/30 transition-all duration-150 shadow-[0_0_20px_rgba(0,199,190,0.2)] animate-pulse-slow`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1"></span>
                  Speaker {currentCaption.speakerId}
                </span>
                <span className="text-[11px] font-mono text-cyan-300/60">Live Transcribing</span>
              </div>
            </div>

            <p className={`${fontSizeClasses} text-white font-medium`}>
              {currentCaption.text}
              <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle rounded-sm"></span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};