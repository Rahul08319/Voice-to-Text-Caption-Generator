import React, { useMemo, useCallback, useState } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { CaptionDisplay } from './components/CaptionDisplay';
import { useGeminiLive } from './hooks/useGeminiLive';
import { Status, Caption } from './types';

const App: React.FC = () => {
  const { status, history, currentCaption, start, stop } = useGeminiLive();
  const [inputLanguage, setInputLanguage] = useState<string>('en-US');
  const [targetLanguage, setTargetLanguage] = useState<string>('none');
  const [silenceTimeout, setSilenceTimeout] = useState<number>(30);
  const [numSpeakers, setNumSpeakers] = useState<number>(1);
  const [volume, setVolume] = useState<number>(0);
  const [noiseReductionLevel, setNoiseReductionLevel] = useState<number>(0.2);


  const isRecording = useMemo(() => 
    status === Status.CONNECTING || status === Status.LISTENING, 
    [status]
  );

  const statusMessage = useMemo(() => {
    switch (status) {
      case Status.IDLE:
        return 'Click the microphone to start captioning';
      case Status.CONNECTING:
        return 'Connecting to Gemini...';
      case Status.LISTENING:
        return 'Listening... Speak now!';
      case Status.PROCESSING:
        return 'Processing...';
      case Status.ERROR:
        return 'An error occurred. Please try again.';
      default:
        return '';
    }
  }, [status]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, []);

  const handleStart = useCallback(() => {
    start(inputLanguage, targetLanguage, silenceTimeout, numSpeakers, noiseReductionLevel, handleVolumeChange);
  }, [start, inputLanguage, targetLanguage, silenceTimeout, numSpeakers, noiseReductionLevel, handleVolumeChange]);

  const handleDownload = useCallback(() => {
    const fullText = [...history, currentCaption]
      .filter((c): c is Caption => c !== null && c.text.trim() !== '')
      .map(c => `Speaker ${c.speakerId}: ${c.text}`)
      .join('\n\n');
      
    if (!fullText.trim()) return;

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history, currentCaption]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex flex-col container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        <div className="bg-gray-800 rounded-lg shadow-2xl flex-grow flex flex-col overflow-hidden">
          <CaptionDisplay 
            history={history} 
            currentCaption={currentCaption}
            onDownload={handleDownload}
          />
          <div className="p-6 border-t border-gray-700">
            <div className="flex justify-center items-start flex-wrap gap-4 w-full mb-6">
              <div className="flex flex-col items-center space-y-2">
                <label htmlFor="input-language-select" className="text-gray-400">
                  Speak in:
                </label>
                <select
                  id="input-language-select"
                  value={inputLanguage}
                  onChange={(e) => setInputLanguage(e.target.value)}
                  disabled={isRecording}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full max-w-xs p-2.5 transition-colors"
                  aria-label="Select input language for transcription"
                >
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Mandarin Chinese</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="ru-RU">Russian</option>
                  <option value="ar-SA">Arabic</option>
                </select>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <label htmlFor="target-language-select" className="text-gray-400">
                  Translate to:
                </label>
                <select
                  id="target-language-select"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  disabled={isRecording}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full max-w-xs p-2.5 transition-colors"
                  aria-label="Select target language for translation"
                >
                  <option value="none">Original Language</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Mandarin Chinese">Mandarin Chinese</option>
                  <option value="Russian">Russian</option>
                  <option value="Korean">Korean</option>
                  <option value="Italian">Italian</option>
                </select>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <label htmlFor="num-speakers-select" className="text-gray-400">
                  Speakers:
                </label>
                <select
                  id="num-speakers-select"
                  value={numSpeakers}
                  onChange={(e) => setNumSpeakers(Number(e.target.value))}
                  disabled={isRecording}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full max-w-xs p-2.5 transition-colors"
                  aria-label="Select number of speakers"
                >
                  <option value="1">1 (Diarization OFF)</option>
                  <option value="2">2 Speakers</option>
                  <option value="3">3 Speakers</option>
                  <option value="4">4 Speakers</option>
                  <option value="5">5 Speakers</option>
                </select>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <label htmlFor="silence-timeout-select" className="text-gray-400">
                  Auto-stop after:
                </label>
                <select
                  id="silence-timeout-select"
                  value={silenceTimeout}
                  onChange={(e) => setSilenceTimeout(Number(e.target.value))}
                  disabled={isRecording}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full max-w-xs p-2.5 transition-colors"
                  aria-label="Select silence duration for auto-stop"
                >
                  <option value="15">15s of silence</option>
                  <option value="30">30s of silence</option>
                  <option value="60">1 minute of silence</option>
                  <option value="0">Disabled</option>
                </select>
              </div>
               <div className="flex flex-col items-center space-y-2 w-full max-w-xs">
                <label htmlFor="noise-reduction-slider" className="text-gray-400">
                  Noise Reduction
                </label>
                <div className="flex items-center space-x-3 w-full">
                  <span className="text-xs text-gray-500">Off</span>
                  <input
                    id="noise-reduction-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={noiseReductionLevel}
                    onChange={(e) => setNoiseReductionLevel(Number(e.target.value))}
                    disabled={isRecording}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Adjust noise reduction level"
                  />
                  <span className="text-xs text-gray-500">Max</span>
                </div>
              </div>
            </div>
            <Controls 
              isRecording={isRecording}
              onStart={handleStart}
              onStop={stop}
              statusMessage={statusMessage}
              volume={volume}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;