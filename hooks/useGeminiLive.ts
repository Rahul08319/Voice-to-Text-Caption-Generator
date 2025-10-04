import { useState, useRef, useCallback } from 'react';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
} from '@google/genai';
import { Status, Caption } from '../types';
import { createPcmBlob } from '../utils/audioUtils';

// Initialize the Google Gemini AI client.
// As per guidelines, the API key is expected to be in process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const useGeminiLive = () => {
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [history, setHistory] = useState<Caption[]>([]);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  
  // Refs to hold mutable values that don't trigger re-renders
  const currentCaptionRef = useRef<Caption | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  // Refs for audio enhancement and analysis
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const peakingFilterRef = useRef<BiquadFilterNode | null>(null);
  const noiseGateNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);


  const stopLiveSession = useCallback(() => {
    // Clear the silence timer and animation frame
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => {
        session.close();
      });
      sessionPromiseRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect all audio nodes in reverse order
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
     if (noiseGateNodeRef.current) {
      noiseGateNodeRef.current.disconnect();
      noiseGateNodeRef.current = null;
    }
    if (analyserNodeRef.current) {
      analyserNodeRef.current.disconnect();
      analyserNodeRef.current = null;
    }
    if (peakingFilterRef.current) {
        peakingFilterRef.current.disconnect();
        peakingFilterRef.current = null;
    }
    if (highPassFilterRef.current) {
        highPassFilterRef.current.disconnect();
        highPassFilterRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Add any remaining partial caption to history
    if (currentCaptionRef.current && currentCaptionRef.current.text.trim()) {
        setHistory(prev => [...prev, currentCaptionRef.current!]);
    }
    currentCaptionRef.current = null;
    setCurrentCaption(null);
    setStatus(Status.IDLE);
  }, []);

  const startLiveSession = useCallback(async (
    inputLanguage: string, 
    targetLanguage: string, 
    silenceTimeout: number, 
    numSpeakers: number,
    noiseReductionLevel: number,
    onVolumeChange: (volume: number) => void
  ) => {
    if (status !== Status.IDLE) return;
    setStatus(Status.CONNECTING);
    onVolumeChange(0); // Reset volume on start

    const isTranslating = targetLanguage && targetLanguage !== 'none';
    const isDiarizationEnabled = numSpeakers > 1;
    let systemInstruction: string | undefined = undefined;

    if (isTranslating) {
      systemInstruction = `You are a real-time translator. Translate everything the user says into ${targetLanguage}. Do not add any conversational filler. Only provide the direct translation.`;
    }
    
    const resetSilenceTimer = () => {
      if (silenceTimeout > 0) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = window.setTimeout(() => {
          stopLiveSession();
        }, silenceTimeout * 1000);
      }
    };

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus(Status.LISTENING);
            resetSilenceTimer(); // Start the timer when listening begins
            
            // Setup audio processing pipeline
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current!);
            
            // --- Voice Clarity Boost ---
            highPassFilterRef.current = audioContextRef.current.createBiquadFilter();
            highPassFilterRef.current.type = 'highpass';
            highPassFilterRef.current.frequency.value = 100;

            peakingFilterRef.current = audioContextRef.current.createBiquadFilter();
            peakingFilterRef.current.type = 'peaking';
            peakingFilterRef.current.frequency.value = 3000;
            peakingFilterRef.current.gain.value = 3;
            peakingFilterRef.current.Q.value = 1;

            // --- Noise Reduction Gate ---
            noiseGateNodeRef.current = audioContextRef.current.createGain();

            // --- Volume Analysis ---
            analyserNodeRef.current = audioContextRef.current.createAnalyser();
            analyserNodeRef.current.fftSize = 256;
            const bufferLength = analyserNodeRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const drawVolume = () => {
              animationFrameRef.current = requestAnimationFrame(drawVolume);
              if (analyserNodeRef.current && noiseGateNodeRef.current && audioContextRef.current) {
                analyserNodeRef.current.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((acc, val) => acc + val, 0);
                const average = sum / bufferLength;
                const normalizedVolume = average / 128; // Normalize to ~0-2 range
                onVolumeChange(normalizedVolume);
                 
                // Apply noise gate logic
                if (noiseReductionLevel > 0) {
                    const gateThreshold = noiseReductionLevel * 0.15; // Map slider 0-1 to a volume threshold
                    if (normalizedVolume < gateThreshold) {
                        // Volume is below threshold, ramp down gain to 0
                        noiseGateNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
                    } else {
                        // Volume is above threshold, ramp up gain to 1
                        noiseGateNodeRef.current.gain.setTargetAtTime(1, audioContextRef.current.currentTime, 0.01);
                    }
                } else {
                    // If noise reduction is off, ensure gain is 1
                    noiseGateNodeRef.current.gain.setTargetAtTime(1, audioContextRef.current.currentTime, 0.01);
                }
              }
            };
            drawVolume();

            processorNodeRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorNodeRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            // Connect the full audio pipeline:
            // source -> filters -> analyser -> gate -> processor -> destination
            const source = mediaStreamSourceRef.current;
            const highPass = highPassFilterRef.current;
            const peaking = peakingFilterRef.current;
            const analyser = analyserNodeRef.current;
            const gate = noiseGateNodeRef.current;
            const processor = processorNodeRef.current;
            const destination = audioContextRef.current.destination;

            source.connect(highPass);
            highPass.connect(peaking);
            peaking.connect(analyser); // Analyser listens to the filtered audio
            analyser.connect(gate); // The gate receives the analyzed audio
            gate.connect(processor); // The processor gets the gated audio
            processor.connect(destination); // Connect processor to output (for potential monitoring)
          },
          onmessage: (message: LiveServerMessage) => {
            const transcription = isTranslating
              ? message.serverContent?.outputTranscription
              : message.serverContent?.inputTranscription;

            if (transcription?.text) {
                resetSilenceTimer();
                // FIX: Cast transcription to include optional speakerId property to handle diarization.
                const speakerId = (transcription as { speakerId?: number }).speakerId ?? 1;
                const text = transcription.text;

                if (currentCaptionRef.current && currentCaptionRef.current.speakerId === speakerId) {
                    currentCaptionRef.current.text += text;
                } else {
                    if (currentCaptionRef.current && currentCaptionRef.current.text.trim()) {
                        setHistory(prev => [...prev, currentCaptionRef.current!]);
                    }
                    currentCaptionRef.current = { speakerId, text };
                }
                setCurrentCaption({ ...currentCaptionRef.current });
            }

            if (message.serverContent?.turnComplete) {
              if (currentCaptionRef.current && currentCaptionRef.current.text.trim()) {
                setHistory(prev => [...prev, currentCaptionRef.current]);
              }
              currentCaptionRef.current = null;
              setCurrentCaption(null);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live API Error:', e);
            setStatus(Status.ERROR);
            stopLiveSession();
          },
          onclose: () => {
            if (status !== Status.IDLE && status !== Status.ERROR) {
                stopLiveSession();
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: { 
            languageCode: inputLanguage,
            ...(isDiarizationEnabled && { 
              enableSpeakerDiarization: true,
              numSpeakers
            })
          },
          ...(isTranslating && { outputAudioTranscription: {} }),
          ...(systemInstruction && { systemInstruction }),
        },
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatus(Status.ERROR);
      stopLiveSession();
    }
  }, [status, stopLiveSession]);

  return { status, history, currentCaption, start: startLiveSession, stop: stopLiveSession };
};