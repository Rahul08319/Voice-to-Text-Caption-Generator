import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { CaptionDisplay } from './components/CaptionDisplay';
import { Icon } from './components/Icon';
import { useGeminiLive, resolveApiKey } from './hooks/useGeminiLive';
import { Status, Caption, ExportFormat } from './types';

const App: React.FC = () => {
  const { status, errorMessage, history, currentCaption, start, stop, clearHistory } = useGeminiLive();
  const [inputLanguage, setInputLanguage] = useState<string>('en-US');
  const [targetLanguage, setTargetLanguage] = useState<string>('none');
  const [silenceTimeout, setSilenceTimeout] = useState<number>(30);
  const [numSpeakers, setNumSpeakers] = useState<number>(1);
  const [volume, setVolume] = useState<number>(0);
  const [noiseReductionLevel, setNoiseReductionLevel] = useState<number>(0.2);
  const [activeTab, setActiveTab] = useState<'transcribe' | 'settings'>('transcribe');

  // API Key management (Browser-safe & persistent)
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [tempApiKeyInput, setTempApiKeyInput] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // Dynamic automatic year detection for current and upcoming years
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const hasApiKey = useMemo(() => {
    return Boolean(resolveApiKey(userApiKey));
  }, [userApiKey]);

  const isRecording = useMemo(
    () => status === Status.CONNECTING || status === Status.LISTENING,
    [status]
  );

  const statusMessage = useMemo(() => {
    switch (status) {
      case Status.IDLE:
        return 'Ready to record';
      case Status.CONNECTING:
        return 'Connecting to Gemini Live...';
      case Status.LISTENING:
        return 'Listening... Speak now';
      case Status.PROCESSING:
        return 'Synthesizing speech...';
      case Status.ERROR:
        return errorMessage || 'Connection interrupted. Please verify API key';
      default:
        return 'Standby';
    }
  }, [status, errorMessage]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, []);

  const handleStart = useCallback(() => {
    if (!hasApiKey) {
      setShowApiKeyModal(true);
      return;
    }
    start(
      inputLanguage,
      targetLanguage,
      silenceTimeout,
      numSpeakers,
      noiseReductionLevel,
      handleVolumeChange,
      userApiKey
    );
  }, [hasApiKey, start, inputLanguage, targetLanguage, silenceTimeout, numSpeakers, noiseReductionLevel, handleVolumeChange, userApiKey]);

  const handleSaveApiKey = (keyToSave: string) => {
    const trimmed = keyToSave.trim();
    setUserApiKey(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
    setShowApiKeyModal(false);
  };

  // Global keyboard shortcuts (Space to toggle, Esc to stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is interacting with an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRecording) {
          stop();
        } else {
          handleStart();
        }
      } else if (e.code === 'Escape' && isRecording) {
        e.preventDefault();
        stop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, handleStart, stop]);

  // Multi-format export (TXT, SRT, VTT, JSON)
  const handleDownload = useCallback(
    (format: ExportFormat = 'txt') => {
      const fullCaptions = [...history, currentCaption].filter(
        (c): c is Caption => c !== null && c.text.trim() !== ''
      );

      if (fullCaptions.length === 0) return;

      let content = '';
      let mimeType = 'text/plain';
      let extension = 'txt';

      if (format === 'txt') {
        content = fullCaptions
          .map((c) => `[${c.timestamp || '00:00:00'}] Speaker ${c.speakerId}: ${c.text}`)
          .join('\n\n');
        mimeType = 'text/plain';
        extension = 'txt';
      } else if (format === 'srt') {
        content = fullCaptions
          .map((c, idx) => {
            const startSec = idx * 4;
            const endSec = startSec + 3;
            const formatSrtTime = (s: number) => {
              const h = Math.floor(s / 3600).toString().padStart(2, '0');
              const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
              const sc = Math.floor(s % 60).toString().padStart(2, '0');
              return `${h}:${m}:${sc},000`;
            };
            return `${idx + 1}\n${formatSrtTime(startSec)} --> ${formatSrtTime(endSec)}\n[Speaker ${c.speakerId}] ${c.text}\n`;
          })
          .join('\n');
        mimeType = 'application/x-subrip';
        extension = 'srt';
      } else if (format === 'vtt') {
        content =
          'WEBVTT\n\n' +
          fullCaptions
            .map((c, idx) => {
              const startSec = idx * 4;
              const endSec = startSec + 3;
              const formatVttTime = (s: number) => {
                const m = Math.floor(s / 60).toString().padStart(2, '0');
                const sc = Math.floor(s % 60).toString().padStart(2, '0');
                return `00:${m}:${sc}.000`;
              };
              return `${idx + 1}\n${formatVttTime(startSec)} --> ${formatVttTime(endSec)}\n<v Speaker ${c.speakerId}>${c.text}\n`;
            })
            .join('\n');
        mimeType = 'text/vtt';
        extension = 'vtt';
      } else if (format === 'json') {
        content = JSON.stringify(
          {
            generator: 'Voice-to-Text Caption Generator (Apple Edition)',
            exportedAt: new Date().toISOString(),
            language: inputLanguage,
            translation: targetLanguage,
            utteranceCount: fullCaptions.length,
            captions: fullCaptions,
          },
          null,
          2
        );
        mimeType = 'application/json';
        extension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `captions-${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [history, currentCaption, inputLanguage, targetLanguage]
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Apple Studio Header */}
      <Header
        currentYear={currentYear}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={() => {
          setTempApiKeyInput(userApiKey);
          setShowApiKeyModal(true);
        }}
      />

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col container mx-auto px-4 pb-8 max-w-4xl">
        {/* Main Apple Liquid Glass Console */}
        <div className="apple-glass rounded-3xl flex-grow flex flex-col overflow-hidden relative border border-white/[0.09]">
          {/* Navigation Segment Tabs */}
          <div className="px-6 pt-4 pb-2 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex rounded-xl bg-white/[0.05] p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('transcribe')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center space-x-1.5 ${
                  activeTab === 'transcribe'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon.Waveform className="w-3.5 h-3.5" />
                <span>Live Studio</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center space-x-1.5 ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon.Sliders className="w-3.5 h-3.5" />
                <span>Audio Engine Settings</span>
              </button>
            </div>

            {/* Live Model Badge */}
            <div className="flex items-center space-x-2 text-xs text-white/50">
              <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
              <span>{hasApiKey ? 'Gemini 2.5 Audio Ready' : 'Key Required for Mic'}</span>
            </div>
          </div>

          {/* Missing API Key Alert Banner if not set */}
          {!hasApiKey && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-2 text-amber-300">
                <Icon.Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Gemini API Key is needed for live speech recognition.</span>
              </div>
              <button
                onClick={() => {
                  setTempApiKeyInput(userApiKey);
                  setShowApiKeyModal(true);
                }}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-medium transition-all"
              >
                Configure Key →
              </button>
            </div>
          )}

          {/* Tab 1: Live Studio Transcriber */}
          {activeTab === 'transcribe' && (
            <div className="flex-grow flex flex-col min-h-[320px]">
              <CaptionDisplay
                history={history}
                currentCaption={currentCaption}
                onDownload={handleDownload}
                onClear={clearHistory}
                isRecording={isRecording}
              />
            </div>
          )}

          {/* Tab 2: Settings Configuration Panel */}
          {activeTab === 'settings' && (
            <div className="flex-grow p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-1">
                  Audio &amp; Recognition Configuration
                </h3>
                <p className="text-xs text-white/40">
                  Tune language models, speaker diarization, DSP noise-gate filters, and API credentials.
                </p>
              </div>

              {/* Apple Bento Grid for Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spoken Language Picker */}
                <div className="p-4 rounded-2xl apple-glass-card space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Icon.Globe className="w-4 h-4" />
                    <label htmlFor="input-language-select" className="text-xs font-semibold text-white/90">
                      Spoken Input Language
                    </label>
                  </div>
                  <select
                    id="input-language-select"
                    value={inputLanguage}
                    onChange={(e) => setInputLanguage(e.target.value)}
                    disabled={isRecording}
                    className="w-full bg-white/[0.05] border border-white/10 text-white text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-400/40 focus:outline-none transition-colors"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Spanish (Español)</option>
                    <option value="fr-FR">French (Français)</option>
                    <option value="de-DE">German (Deutsch)</option>
                    <option value="it-IT">Italian (Italiano)</option>
                    <option value="pt-BR">Portuguese (Português - Brasil)</option>
                    <option value="ja-JP">Japanese (日本語)</option>
                    <option value="ko-KR">Korean (한국어)</option>
                    <option value="zh-CN">Mandarin Chinese (简体中文)</option>
                    <option value="hi-IN">Hindi (हिन्दी)</option>
                    <option value="ru-RU">Russian (Русский)</option>
                    <option value="ar-SA">Arabic (العربية)</option>
                  </select>
                </div>

                {/* Target Translation Language */}
                <div className="p-4 rounded-2xl apple-glass-card space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <Icon.Sparkles className="w-4 h-4" />
                    <label htmlFor="target-language-select" className="text-xs font-semibold text-white/90">
                      Real-time Translation Target
                    </label>
                  </div>
                  <select
                    id="target-language-select"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    disabled={isRecording}
                    className="w-full bg-white/[0.05] border border-white/10 text-white text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-400/40 focus:outline-none transition-colors"
                  >
                    <option value="none">Original Language (No Translation)</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Mandarin Chinese">Mandarin Chinese (中文)</option>
                    <option value="Russian">Russian (Русский)</option>
                    <option value="Korean">Korean (한국어)</option>
                    <option value="Italian">Italian (Italiano)</option>
                  </select>
                </div>

                {/* Speaker Diarization */}
                <div className="p-4 rounded-2xl apple-glass-card space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Icon.Users className="w-4 h-4" />
                    <label htmlFor="num-speakers-select" className="text-xs font-semibold text-white/90">
                      Speaker Separation (Diarization)
                    </label>
                  </div>
                  <select
                    id="num-speakers-select"
                    value={numSpeakers}
                    onChange={(e) => setNumSpeakers(Number(e.target.value))}
                    disabled={isRecording}
                    className="w-full bg-white/[0.05] border border-white/10 text-white text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-400/40 focus:outline-none transition-colors"
                  >
                    <option value="1">1 Speaker (Single Mic)</option>
                    <option value="2">2 Distinct Speakers</option>
                    <option value="3">3 Distinct Speakers</option>
                    <option value="4">4 Distinct Speakers</option>
                    <option value="5">5 Distinct Speakers</option>
                  </select>
                </div>

                {/* Auto-Stop Silence Threshold */}
                <div className="p-4 rounded-2xl apple-glass-card space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Icon.Clock className="w-4 h-4" />
                    <label htmlFor="silence-timeout-select" className="text-xs font-semibold text-white/90">
                      Auto-Stop on Silence
                    </label>
                  </div>
                  <select
                    id="silence-timeout-select"
                    value={silenceTimeout}
                    onChange={(e) => setSilenceTimeout(Number(e.target.value))}
                    disabled={isRecording}
                    className="w-full bg-white/[0.05] border border-white/10 text-white text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400/40 focus:outline-none transition-colors"
                  >
                    <option value="15">15 seconds of silence</option>
                    <option value="30">30 seconds of silence (Recommended)</option>
                    <option value="60">1 minute of silence</option>
                    <option value="0">Continuous (Never auto-stop)</option>
                  </select>
                </div>
              </div>

              {/* Noise Gate Level */}
              <div className="p-4 rounded-2xl apple-glass-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Icon.Sliders className="w-4 h-4" />
                    <label htmlFor="noise-reduction-slider" className="text-xs font-semibold text-white/90">
                      DSP Noise Reduction Gate
                    </label>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    {Math.round(noiseReductionLevel * 100)}%
                  </span>
                </div>
                <input
                  id="noise-reduction-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={noiseReductionLevel}
                  onChange={(e) => setNoiseReductionLevel(Number(e.target.value))}
                  disabled={isRecording}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
                />
                <div className="flex justify-between text-[11px] text-white/40">
                  <span>Raw Audio (0%)</span>
                  <span>Balanced (20%)</span>
                  <span>Aggressive Gate (100%)</span>
                </div>
              </div>

              {/* API Key Management Card */}
              <div className="p-4 rounded-2xl apple-glass-card space-y-3 border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Icon.Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold text-white/90">Gemini API Credentials</span>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${hasApiKey ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {hasApiKey ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Your API key is used directly from your browser to connect securely to the Gemini Live WebSockets API.
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    placeholder="Enter AI Studio Gemini API Key..."
                    value={tempApiKeyInput || userApiKey}
                    onChange={(e) => setTempApiKeyInput(e.target.value)}
                    className="flex-1 bg-white/[0.05] border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-400/40 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveApiKey(tempApiKeyInput || userApiKey)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium transition-colors"
                  >
                    Save
                  </button>
                  {userApiKey && (
                    <button
                      onClick={() => handleSaveApiKey('')}
                      className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-red-500/20 text-white/60 hover:text-red-300 text-xs transition-colors"
                      title="Clear stored key"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Controls Bar */}
          <div className="p-6 border-t border-white/[0.08] bg-white/[0.02] flex flex-col items-center">
            {/* Quick settings row when in transcribe tab */}
            {activeTab === 'transcribe' && (
              <div className="w-full flex items-center justify-center flex-wrap gap-3 mb-5 text-xs text-white/70">
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
                  <span className="text-white/40">Input:</span>
                  <span className="text-white/90 font-medium">
                    {inputLanguage.split('-')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
                  <span className="text-white/40">Translation:</span>
                  <span className="text-white/90 font-medium">
                    {targetLanguage === 'none' ? 'Off' : targetLanguage}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
                  <span className="text-white/40">Speakers:</span>
                  <span className="text-white/90 font-medium">
                    {numSpeakers === 1 ? 'Single' : `${numSpeakers} Diarized`}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-cyan-400 hover:text-cyan-300 text-xs underline underline-offset-2 ml-1"
                >
                  Configure →
                </button>
              </div>
            )}

            <Controls
              isRecording={isRecording}
              onStart={handleStart}
              onStop={stop}
              statusMessage={statusMessage}
              volume={volume}
            />
          </div>
        </div>

        {/* Apple Style Footer with Dynamic Auto-Update Logic */}
        <footer className="mt-8 text-center text-xs text-white/40 space-y-2">
          <p className="flex items-center justify-center space-x-2">
            <span>Voice-to-Text Caption Generator</span>
            <span>•</span>
            <span>Crafted with Apple HIG &amp; Liquid Glass Aesthetics</span>
            <span>•</span>
            <span className="font-mono text-cyan-400/80">© 2025–{currentYear}</span>
          </p>
          <p className="text-[11px] text-white/30">
            Automated maintenance pipeline enabled • Real-time Multimodal WebSockets stream with Gemini 2.5
          </p>
        </footer>
      </main>

      {/* Apple Liquid Glass API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl apple-glass border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Icon.Sparkles className="w-5 h-5" />
                <h3 className="text-base font-semibold text-white">Gemini API Key Required</h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-white/40 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              To stream audio directly to Google Gemini 2.5 Live, please enter your API key. The key is securely stored in your local browser storage.
            </p>

            <div className="space-y-2">
              <label htmlFor="modal-key-input" className="text-xs font-medium text-white/80">
                Google AI Studio API Key
              </label>
              <input
                id="modal-key-input"
                type="password"
                placeholder="AIzaSy..."
                value={tempApiKeyInput}
                onChange={(e) => setTempApiKeyInput(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              />
              <p className="text-[11px] text-white/40">
                Don't have a key? Get a free key at{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline underline-offset-2"
                >
                  ai.google.dev
                </a>
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveApiKey(tempApiKeyInput)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 transition-all"
              >
                Save &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;