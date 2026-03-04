import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";


interface VibroacousticPattern {
  id: string;
  name: string;
  frequencies: number[];
  vibrationPattern: number[];
  hapticIntensity: 'light' | 'medium' | 'heavy';
  duration: number; // in seconds
}

interface VibroacousticContextType {
  // Audio Enhancement
  playBinauralBeats: (leftFreq: number, rightFreq: number, duration?: number) => Promise<void>;
  playSolfeggio: (frequency: number, duration?: number) => Promise<void>;
  playChakraFrequency: (chakra: string) => Promise<void>;
  
  // Haptic Feedback
  triggerHapticPattern: (pattern: string) => Promise<void>;
  triggerCustomVibration: (pattern: number[]) => void;
  
  // Synchronized Vibroacoustic
  startVibroacousticSession: (sessionType: string) => Promise<void>;
  stopVibroacousticSession: () => Promise<void>;
  
  // Real-time Controls
  setVibroacousticIntensity: (intensity: number) => void; // 0-1
  setHapticSensitivity: (sensitivity: number) => void; // 0-1
  setBinauralIntensity: (intensity: number) => void; // 0-1
  setIsochronicIntensity: (intensity: number) => void; // 0-1
  
  // State
  isVibroacousticActive: boolean;
  currentPattern: string | null;
  intensity: number;
  hapticSensitivity: number;
  binauralIntensity: number;
  isochronicIntensity: number;
  
  // Binaural Beat Generator
  generateBinauralBeat: (baseFreq: number, beatFreq: number) => Promise<void>;
  
  // Frequency Healing
  playHealingFrequency: (frequency: number, waveform: 'sine' | 'square' | 'triangle' | 'sawtooth') => Promise<void>;
  playIsochronicTone: (frequency: number, waveform?: 'sine' | 'square' | 'triangle' | 'sawtooth') => Promise<void>;
}

const SOLFEGGIO_FREQUENCIES = {
  '174': { name: 'Foundation', chakra: 'root' },
  '285': { name: 'Quantum Cognition', chakra: 'sacral' },
  '396': { name: 'Liberation from Fear', chakra: 'root' },
  '417': { name: 'Facilitating Change', chakra: 'sacral' },
  '528': { name: 'Love & DNA Repair', chakra: 'heart' },
  '639': { name: 'Connecting Relationships', chakra: 'heart' },
  '741': { name: 'Awakening Intuition', chakra: 'throat' },
  '852': { name: 'Returning to Spiritual Order', chakra: 'third_eye' },
  '963': { name: 'Divine Consciousness', chakra: 'crown' }
};

const CHAKRA_FREQUENCIES = {
  root: 396,
  sacral: 417,
  solar_plexus: 528,
  heart: 639,
  throat: 741,
  third_eye: 852,
  crown: 963
};

const VIBROACOUSTIC_PATTERNS: Record<string, VibroacousticPattern> = {
  meditation: {
    id: 'meditation',
    name: 'Deep Meditation',
    frequencies: [40, 10, 6], // Gamma, Alpha, Theta
    vibrationPattern: [200, 100, 200, 100, 500, 200],
    hapticIntensity: 'light',
    duration: 300
  },
  healing: {
    id: 'healing',
    name: 'Cellular Healing',
    frequencies: [528, 741, 852], // Love, Detox, Intuition
    vibrationPattern: [300, 150, 300, 150, 600, 300],
    hapticIntensity: 'medium',
    duration: 600
  },
  energizing: {
    id: 'energizing',
    name: 'Energy Boost',
    frequencies: [20, 40, 100], // Beta, Gamma, High Beta
    vibrationPattern: [100, 50, 100, 50, 200, 100],
    hapticIntensity: 'heavy',
    duration: 180
  },
  relaxation: {
    id: 'relaxation',
    name: 'Deep Relaxation',
    frequencies: [8, 4, 2], // Alpha, Theta, Delta
    vibrationPattern: [400, 200, 400, 200, 800, 400],
    hapticIntensity: 'light',
    duration: 900
  },
  focus: {
    id: 'focus',
    name: 'Enhanced Focus',
    frequencies: [15, 20, 25], // Beta range
    vibrationPattern: [150, 75, 150, 75, 300, 150],
    hapticIntensity: 'medium',
    duration: 240
  }
};

const HAPTIC_PATTERNS = {
  gentle_pulse: [100, 200, 100, 200, 100],
  rhythmic_wave: [50, 100, 150, 100, 200, 100, 150, 100, 50],
  power_surge: [200, 50, 300, 50, 400, 50, 300, 50, 200],
  meditation_breath: [250, 250, 250, 250, 500, 500],
  healing_resonance: [300, 100, 200, 100, 400, 200, 300, 100],
  chakra_activation: [100, 50, 100, 50, 200, 100, 300, 150, 400, 200]
};

interface VibroacousticRefs {
  audioContext: any;
  audioContextClosed: boolean;
  oscillators: any[];
  gainNodes: any[];
  binauralGainNodes: any[];
  isochronicGainNodes: any[];
  nativeBinauralSounds: Audio.Sound[];
  nativeIsochronicSound: Audio.Sound | null;
  isochronicInterval: ReturnType<typeof setInterval> | null;
  isochronicGateState: boolean;
  isoIntensity: number;
  vibroacousticTimer: ReturnType<typeof setTimeout> | null;
  hapticInterval: ReturnType<typeof setInterval> | null;
  isStopping: boolean;
}

export const [VibroacousticProvider, useVibroacoustic] = createContextHook<VibroacousticContextType>(() => {
  const [isVibroacousticActive, setIsVibroacousticActive] = useState(false);
  const [currentPattern, setCurrentPattern] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(0.2);
  const [hapticSensitivity, setHapticSensitivityState] = useState(0.8);
  const [binauralIntensity, setBinauralIntensityState] = useState(0.5);
  const [isochronicIntensity, setIsochronicIntensityState] = useState(0.5);
  
  const refs = useRef<VibroacousticRefs>({
    audioContext: null,
    audioContextClosed: false,
    oscillators: [],
    gainNodes: [],
    binauralGainNodes: [],
    isochronicGainNodes: [],
    nativeBinauralSounds: [],
    nativeIsochronicSound: null,
    isochronicInterval: null,
    isochronicGateState: false,
    isoIntensity: isochronicIntensity,
    vibroacousticTimer: null,
    hapticInterval: null,
    isStopping: false,
  });

  const generateToneDataUri = useCallback((frequency: number, duration = 1, sampleRate = 44100) => {
    const totalSamples = Math.max(1, Math.floor(duration * sampleRate));
    const amplitude = 0.6;
    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i += 1) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF header
    writeString(0, "RIFF");
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeString(8, "WAVE");

    // fmt chunk
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample

    // data chunk
    writeString(36, "data");
    view.setUint32(40, totalSamples * 2, true);

    const twoPiF = 2 * Math.PI * frequency;
    for (let i = 0; i < totalSamples; i += 1) {
      const t = i / sampleRate;
      const sample = Math.sin(twoPiF * t) * amplitude;
      const intSample = Math.max(-1, Math.min(1, sample)) * 0x7fff;
      view.setInt16(44 + i * 2, intSample, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:audio/wav;base64,${base64}`;
  }, []);

  const stopVibroacousticSession = useCallback(async () => {
    if (refs.current.isStopping) {
      console.log('Stop request already in progress');
      return;
    }

    refs.current.isStopping = true;

    try {
      console.log('Stopping vibroacoustic session');
      console.log(`Stopping ${refs.current.oscillators.length} oscillators, ${refs.current.binauralGainNodes.length} binaural nodes, ${refs.current.isochronicGainNodes.length} iso nodes`);
      
      setIsVibroacousticActive(false);
      setCurrentPattern(null);
    
      if (refs.current.isochronicInterval) {
        clearInterval(refs.current.isochronicInterval);
        refs.current.isochronicInterval = null;
      }
  
      const oscillatorCleanupPromises = refs.current.oscillators.map(async (osc, index) => {
        try {
          if (osc && typeof osc.stop === 'function') {
            osc.stop();
            console.log(`Stopped oscillator ${index}`);
            return;
          }
          if (osc && typeof (osc as Audio.Sound).stopAsync === 'function') {
            try {
              await (osc as Audio.Sound).stopAsync();
            } catch {}
            if (typeof (osc as Audio.Sound).unloadAsync === 'function') {
              await (osc as Audio.Sound).unloadAsync();
            }
            console.log(`Unloaded audio sound ${index}`);
            return;
          }
          if (osc && typeof (osc as Audio.Sound).unloadAsync === 'function') {
            await (osc as Audio.Sound).unloadAsync();
            console.log(`Unloaded audio sound ${index}`);
          }
        } catch (error) {
          console.log(`Oscillator ${index} already stopped or error:`, error);
        }
      });
      await Promise.all(oscillatorCleanupPromises);
      refs.current.oscillators = [];
      refs.current.gainNodes = [];
    
      if (refs.current.vibroacousticTimer) {
        clearTimeout(refs.current.vibroacousticTimer);
        refs.current.vibroacousticTimer = null;
      }
      
      if (refs.current.hapticInterval) {
        clearInterval(refs.current.hapticInterval);
        refs.current.hapticInterval = null;
      }
    
      refs.current.binauralGainNodes = [];
      refs.current.isochronicGainNodes = [];
      refs.current.nativeBinauralSounds = [];
    
      if (refs.current.nativeIsochronicSound) {
        try {
          await refs.current.nativeIsochronicSound.stopAsync();
          await refs.current.nativeIsochronicSound.unloadAsync();
        } catch {}
        refs.current.nativeIsochronicSound = null;
      }
    
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
    } finally {
      refs.current.isStopping = false;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      }).catch((error) => {
        console.log('Failed to set audio mode', error);
      });
    }
  }, []);

  // Initialize Web Audio API for advanced audio synthesis
  useEffect(() => {
    const refStore = refs.current;
    if (Platform.OS === 'web') {
      try {
        const AudioContextClass =
          (window as typeof window & { webkitAudioContext?: new () => any }).AudioContext ??
          (window as typeof window & { webkitAudioContext?: new () => any }).webkitAudioContext;

        if (!refStore.audioContext || refStore.audioContextClosed) {
          if (AudioContextClass) {
            refStore.audioContext = new AudioContextClass();
            console.log('Web Audio Context initialized');
          } else {
            console.log('Web Audio API not available: missing constructor');
          }
        }

        refStore.audioContextClosed = false;
      } catch (error) {
        console.log('Web Audio API not available:', error);
      }
    }

    return () => {
      void (async () => {
        try {
          await stopVibroacousticSession();
        } catch (error) {
          console.log('Failed to stop vibroacoustic session during cleanup', error);
        }

        if (Platform.OS === 'web') {
          const ctx = refStore.audioContext as { state?: string; close?: () => Promise<void> } | null;
          if (ctx) {
            try {
              if (typeof ctx.close === 'function' && ctx.state !== 'closed') {
                await ctx.close();
              }
            } catch (error) {
              console.log('Failed to close Web Audio context', error);
            } finally {
              refStore.audioContext = null;
              refStore.audioContextClosed = true;
            }
          }
        }
      })();
    };
  }, [stopVibroacousticSession]);

  useEffect(() => {
    (async () => {
      try {
        const [bi, iso] = await Promise.all([
          AsyncStorage.getItem('session_binaural_intensity_v1'),
          AsyncStorage.getItem('session_iso_intensity_v1'),
        ]);
        if (bi != null && typeof bi === 'string') {
          const parsed = parseFloat(bi);
          if (!isNaN(parsed)) {
            setBinauralIntensityState(Math.max(0, Math.min(1, parsed)));
          }
        }
        if (iso != null && typeof iso === 'string') {
          const parsed = parseFloat(iso);
          if (!isNaN(parsed)) {
            setIsochronicIntensityState(Math.max(0, Math.min(1, parsed)));
          }
        }
      } catch (e) {
        console.log('Failed to load stored intensities', e);
      }
    })();
  }, []);

  useEffect(() => {
    refs.current.isoIntensity = isochronicIntensity;
  }, [isochronicIntensity]);

  const createOscillator = useCallback((frequency: number, waveform: OscillatorType = 'sine', group: 'general' | 'binaural' | 'iso' = 'general') => {
    if (Platform.OS !== 'web' || !refs.current.audioContext) return null;
    
    try {
      const oscillator = refs.current.audioContext.createOscillator();
      const gainNode = refs.current.audioContext.createGain();
      
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, refs.current.audioContext.currentTime);
      
      const level = group === 'binaural' ? binauralIntensity : group === 'iso' ? isochronicIntensity : intensity;
      gainNode.gain.setValueAtTime(level * 0.1, refs.current.audioContext.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(refs.current.audioContext.destination);
      
      return { oscillator, gainNode };
    } catch (error) {
      console.error('Error creating oscillator:', error);
      return null;
    }
  }, [intensity, binauralIntensity, isochronicIntensity]);

  const playBinauralBeats = useCallback(async (leftFreq: number, rightFreq: number, duration = 300) => {
    console.log(`Playing binaural beats: ${leftFreq}Hz (L) / ${rightFreq}Hz (R) for ${duration}s`);
    console.log(`Current binaural intensity: ${binauralIntensity}`);
    console.log(`Platform: ${Platform.OS}, AudioContext available: ${!!refs.current.audioContext}`);

    if (Platform.OS === 'web' && refs.current.audioContext) {
      try {
        const leftOsc = createOscillator(leftFreq, 'sine', 'binaural');
        const rightOsc = createOscillator(rightFreq, 'sine', 'binaural');
        
        if (leftOsc && rightOsc) {
          const leftPanner = refs.current.audioContext.createStereoPanner();
          const rightPanner = refs.current.audioContext.createStereoPanner();
          
          leftPanner.pan.setValueAtTime(-1, refs.current.audioContext.currentTime);
          rightPanner.pan.setValueAtTime(1, refs.current.audioContext.currentTime);
          
          leftOsc.gainNode.disconnect();
          rightOsc.gainNode.disconnect();
          
          leftOsc.gainNode.connect(leftPanner);
          rightOsc.gainNode.connect(rightPanner);
          
          leftPanner.connect(refs.current.audioContext.destination);
          rightPanner.connect(refs.current.audioContext.destination);
          
          leftOsc.oscillator.start();
          rightOsc.oscillator.start();
          
          refs.current.oscillators.push(leftOsc.oscillator, rightOsc.oscillator);
          refs.current.gainNodes.push(leftOsc.gainNode, rightOsc.gainNode);
          refs.current.binauralGainNodes.push(leftOsc.gainNode, rightOsc.gainNode);
          
          console.log(`Binaural gain nodes added. Total binaural nodes: ${refs.current.binauralGainNodes.length}`);
          
          setTimeout(() => {
            try {
              leftOsc.oscillator.stop();
              rightOsc.oscillator.stop();
            } catch {
              console.log('Oscillator already stopped');
            }
          }, duration * 1000);
        }
      } catch (error) {
        console.error('Error playing binaural beats:', error);
      }
    } else {
      try {
        const leftSound = new Audio.Sound();
        const rightSound = new Audio.Sound();

        const leftUri = generateToneDataUri(leftFreq, 1);
        const rightUri = generateToneDataUri(rightFreq, 1);

        await Promise.all([
          leftSound.loadAsync({ uri: leftUri }, { isLooping: true, volume: binauralIntensity }),
          rightSound.loadAsync({ uri: rightUri }, { isLooping: true, volume: binauralIntensity }),
        ]);

        await Promise.all([
          leftSound.playAsync(),
          rightSound.playAsync(),
        ]);

        refs.current.nativeBinauralSounds.push(leftSound, rightSound);
        refs.current.oscillators.push(leftSound, rightSound);

        setTimeout(async () => {
          try {
            await leftSound.stopAsync();
            await rightSound.stopAsync();
          } catch {}
        }, duration * 1000);
      } catch (error) {
        console.error('Error playing binaural beats natively:', error);
      }
    }
  }, [createOscillator, binauralIntensity, generateToneDataUri]);

  const playSolfeggio = useCallback(async (frequency: number, duration = 300) => {
    console.log(`Playing Solfeggio frequency: ${frequency}Hz for ${duration}s`);
    
    const solfeggioInfo = SOLFEGGIO_FREQUENCIES[frequency.toString() as keyof typeof SOLFEGGIO_FREQUENCIES];
    if (solfeggioInfo) {
      console.log(`Solfeggio: ${solfeggioInfo.name} (${solfeggioInfo.chakra} chakra)`);
    }
    
    if (Platform.OS === 'web' && refs.current.audioContext) {
      const osc = createOscillator(frequency, 'sine', 'general');
      if (osc) {
        osc.oscillator.start();
        refs.current.oscillators.push(osc.oscillator);
        refs.current.gainNodes.push(osc.gainNode);
        
        setTimeout(() => {
          osc.oscillator.stop();
        }, duration * 1000);
      }
    }
  }, [createOscillator]);

  const playChakraFrequency = useCallback(async (chakra: string) => {
    const frequency = CHAKRA_FREQUENCIES[chakra as keyof typeof CHAKRA_FREQUENCIES];
    if (frequency) {
      console.log(`Playing chakra frequency for ${chakra}: ${frequency}Hz`);
      await playSolfeggio(frequency, 180); // 3 minutes default
    }
  }, [playSolfeggio]);

  const generateBinauralBeat = useCallback(async (baseFreq: number, beatFreq: number) => {
    const leftFreq = baseFreq;
    const rightFreq = baseFreq + beatFreq;
    console.log(`Generating binaural beat: ${beatFreq}Hz beat frequency (${leftFreq}Hz / ${rightFreq}Hz)`);
    await playBinauralBeats(leftFreq, rightFreq);
  }, [playBinauralBeats]);

  const playHealingFrequency = useCallback(async (frequency: number, waveform: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine') => {
    console.log(`Playing healing frequency: ${frequency}Hz (${waveform} wave)`);
    
    if (Platform.OS === 'web' && refs.current.audioContext) {
      const osc = createOscillator(frequency, waveform, 'general');
      if (osc) {
        osc.oscillator.start();
        refs.current.oscillators.push(osc.oscillator);
        refs.current.gainNodes.push(osc.gainNode);
      }
    }
  }, [createOscillator]);

  const triggerHapticPattern = useCallback(async (pattern: string) => {
    if (Platform.OS === 'web') {
      console.log(`Web haptic pattern: ${pattern}`);
      return;
    }

    const vibrationPattern = HAPTIC_PATTERNS[pattern as keyof typeof HAPTIC_PATTERNS];
    if (!vibrationPattern) return;

    console.log(`Triggering haptic pattern: ${pattern} with sensitivity ${hapticSensitivity}`);
    
    try {
      // Use expo-haptics for iOS
      if (Platform.OS === 'ios') {
        const style = hapticSensitivity < 0.34
          ? Haptics.ImpactFeedbackStyle.Light
          : hapticSensitivity < 0.67
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy;
        switch (pattern) {
          case 'gentle_pulse':
          case 'rhythmic_wave':
          case 'power_surge':
          case 'chakra_activation':
            await Haptics.impactAsync(style);
            break;
          case 'meditation_breath':
            await Haptics.notificationAsync(
              hapticSensitivity > 0.5
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Warning
            );
            break;
          case 'healing_resonance':
            await Haptics.selectionAsync();
            break;
        }
      } else {
        // Use Vibration API for Android
        const scaled = vibrationPattern.map((v) => Math.max(0, Math.round(v * hapticSensitivity)));
        Vibration.vibrate(scaled);
      }
    } catch (error) {
      console.error('Error triggering haptic pattern:', error);
    }
  }, [hapticSensitivity]);

  const triggerCustomVibration = useCallback((pattern: number[]) => {
    if (Platform.OS === 'web') return;
    
    console.log('Triggering custom vibration pattern:', pattern);
    const adjustedPattern = pattern.map(v => v * hapticSensitivity);
    Vibration.vibrate(adjustedPattern);
  }, [hapticSensitivity]);

  const startVibroacousticSession = useCallback(async (sessionType: string) => {
    console.log(`Starting vibroacoustic session: ${sessionType}`);
    
    const pattern = VIBROACOUSTIC_PATTERNS[sessionType];
    if (!pattern) {
      console.error(`Unknown session type: ${sessionType}`);
      return;
    }

    setIsVibroacousticActive(true);
    setCurrentPattern(sessionType);

    // Start audio frequencies
    for (const freq of pattern.frequencies) {
      if (freq < 100) {
        // Binaural beats for brainwave entrainment
        await generateBinauralBeat(200, freq);
      } else {
        // Direct frequency healing
        await playHealingFrequency(freq);
      }
    }

    // Start synchronized haptic feedback (reduced frequency for background use)
    refs.current.hapticInterval = setInterval(async () => {
      await triggerHapticPattern(pattern.id);
    }, 15000); // Every 15 seconds for subtle background effect

    // Auto-stop after pattern duration
    refs.current.vibroacousticTimer = setTimeout(() => {
      stopVibroacousticSession();
    }, pattern.duration * 1000);
  }, [generateBinauralBeat, playHealingFrequency, triggerHapticPattern, stopVibroacousticSession]);


  const setVibroacousticIntensity = useCallback((newIntensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(1, newIntensity));
    console.log(`Setting vibroacoustic intensity: ${clampedIntensity}`);
    setIntensity(clampedIntensity);
    
    // Update gain nodes in real-time
    refs.current.gainNodes.forEach(gainNode => {
      if (gainNode && refs.current.audioContext) {
        gainNode.gain.setValueAtTime(
          clampedIntensity * 0.1,
          refs.current.audioContext.currentTime
        );
      }
    });

    // Provide immediate feedback so users feel the change
    try {
      if (Platform.OS === 'web' && refs.current.audioContext) {
        const osc = createOscillator(220, 'sine');
        if (osc) {
          osc.oscillator.start();
          setTimeout(() => {
            try { osc.oscillator.stop(); } catch {}
          }, 180);
        }
      } else {
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {}
  }, [createOscillator]);

  const setHapticSensitivity = useCallback((sensitivity: number) => {
    const clampedSensitivity = Math.max(0, Math.min(1, sensitivity));
    console.log(`Setting haptic sensitivity: ${clampedSensitivity}`);
    setHapticSensitivityState(clampedSensitivity);
    // Immediate preview so the user feels the new level
    void (async () => {
      try {
        await triggerHapticPattern('gentle_pulse');
      } catch (e) {
        console.log('Preview haptic failed', e);
      }
    })();
  }, [triggerHapticPattern]);

  const setBinauralIntensity = useCallback(async (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    console.log(`Setting binaural intensity to ${clamped}, nodes: ${refs.current.binauralGainNodes.length}`);
    setBinauralIntensityState(clamped);
    try { await AsyncStorage.setItem('session_binaural_intensity_v1', String(clamped)); } catch {}
    if (refs.current.audioContext) {
      refs.current.binauralGainNodes.forEach((g, index) => {
        try {
          g.gain.setValueAtTime(clamped * 0.1, refs.current.audioContext.currentTime);
          console.log(`Updated binaural gain node ${index} to ${clamped * 0.1}`);
        } catch (e) {
          console.log(`Failed to update binaural gain node ${index}:`, e);
        }
      });
    } else if (Platform.OS !== 'web') {
      await Promise.all(refs.current.nativeBinauralSounds.map(async (sound, index) => {
        try {
          if (clamped === 0) {
            await sound.stopAsync();
            await sound.unloadAsync();
          } else {
            await sound.setStatusAsync({ volume: clamped });
          }
          console.log(`Updated native binaural sound ${index}`);
        } catch (e) {
          console.log(`Failed to update native binaural sound ${index}:`, e);
        }
      }));
      if (clamped === 0) {
        refs.current.nativeBinauralSounds = [];
      }
    }
  }, []);

  const setIsochronicIntensity = useCallback(async (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    console.log(`Setting isochronic intensity to ${clamped}, nodes: ${refs.current.isochronicGainNodes.length}`);
    setIsochronicIntensityState(clamped);
    refs.current.isoIntensity = clamped;
    try { await AsyncStorage.setItem('session_iso_intensity_v1', String(clamped)); } catch {}
    if (refs.current.audioContext) {
      refs.current.isochronicGainNodes.forEach((g, index) => {
        try {
          g.gain.setValueAtTime(clamped * 0.1, refs.current.audioContext.currentTime);
          console.log(`Updated isochronic gain node ${index} to ${clamped * 0.1}`);
        } catch (e) {
          console.log(`Failed to update isochronic gain node ${index}:`, e);
        }
      });
    } else if (Platform.OS !== 'web') {
      const gateOn = refs.current.isochronicGateState;
      const targetSound = refs.current.nativeIsochronicSound;
      if (targetSound) {
        try {
          if (clamped === 0) {
            await targetSound.stopAsync();
            await targetSound.unloadAsync();
            refs.current.nativeIsochronicSound = null;
            if (refs.current.isochronicInterval) {
              clearInterval(refs.current.isochronicInterval);
              refs.current.isochronicInterval = null;
            }
          } else {
            await targetSound.setVolumeAsync(gateOn ? clamped : 0);
          }
        } catch (e) {
          console.log('Failed to update native isochronic sound:', e);
        }
      }
    }
  }, []);

  const playIsochronicTone = useCallback(async (frequency: number, waveform: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'square') => {
    console.log(`Playing isochronic tone: ${frequency}Hz (${waveform} wave)`);
    console.log(`Current isochronic intensity: ${isochronicIntensity}`);
    console.log(`Platform: ${Platform.OS}, AudioContext available: ${!!refs.current.audioContext}`);

    if (Platform.OS === 'web' && refs.current.audioContext) {
      try {
        const carrierFreq = 220;
        const osc = refs.current.audioContext.createOscillator();
        const gainNode = refs.current.audioContext.createGain();
        const lfoOsc = refs.current.audioContext.createOscillator();
        const lfoGain = refs.current.audioContext.createGain();
        
        osc.type = waveform;
        osc.frequency.setValueAtTime(carrierFreq, refs.current.audioContext.currentTime);
        
        lfoOsc.type = 'square';
        lfoOsc.frequency.setValueAtTime(frequency, refs.current.audioContext.currentTime);
        
        lfoGain.gain.setValueAtTime(isochronicIntensity * 0.05, refs.current.audioContext.currentTime);
        gainNode.gain.setValueAtTime(isochronicIntensity * 0.1, refs.current.audioContext.currentTime);
        
        lfoOsc.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        
        osc.connect(gainNode);
        gainNode.connect(refs.current.audioContext.destination);
        
        osc.start();
        lfoOsc.start();
        
        refs.current.oscillators.push(osc, lfoOsc);
        refs.current.gainNodes.push(gainNode);
        refs.current.isochronicGainNodes.push(gainNode);
        
        console.log(`Isochronic tone started. Total iso nodes: ${refs.current.isochronicGainNodes.length}`);
      } catch (error) {
        console.error('Error playing isochronic tone:', error);
      }
    } else {
      try {
        if (refs.current.isochronicInterval) {
          clearInterval(refs.current.isochronicInterval);
          refs.current.isochronicInterval = null;
        }

        if (refs.current.nativeIsochronicSound) {
          await refs.current.nativeIsochronicSound.unloadAsync();
        }

        const carrierUri = generateToneDataUri(220, 1);
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: carrierUri }, { isLooping: true, volume: 0 });
        await sound.playAsync();
        refs.current.nativeIsochronicSound = sound;
        refs.current.oscillators.push(sound);

        const intervalMs = Math.max(20, (1 / Math.max(frequency, 0.1)) * 500);
        refs.current.isochronicGateState = false;
        refs.current.isochronicInterval = setInterval(() => {
          refs.current.isochronicGateState = !refs.current.isochronicGateState;
          const targetVolume = refs.current.isochronicGateState ? refs.current.isoIntensity : 0;
          sound.setVolumeAsync(targetVolume).catch(() => {});
        }, intervalMs);
      } catch (error) {
        console.error('Error playing isochronic tone natively:', error);
      }
    }
  }, [generateToneDataUri, isochronicIntensity]);

  return useMemo(() => ({
    // Audio Enhancement
    playBinauralBeats,
    playSolfeggio,
    playChakraFrequency,
    
    // Haptic Feedback
    triggerHapticPattern,
    triggerCustomVibration,
    
    // Synchronized Vibroacoustic
    startVibroacousticSession,
    stopVibroacousticSession,
    
    // Real-time Controls
    setVibroacousticIntensity,
    setHapticSensitivity,
    setBinauralIntensity,
    setIsochronicIntensity,
    
    // State
    isVibroacousticActive,
    currentPattern,
    intensity,
    hapticSensitivity,
    binauralIntensity,
    isochronicIntensity,
    
    // Binaural Beat Generator
    generateBinauralBeat,
    
    // Frequency Healing
    playHealingFrequency,
    playIsochronicTone,
  }), [
    playBinauralBeats,
    playSolfeggio,
    playChakraFrequency,
    triggerHapticPattern,
    triggerCustomVibration,
    startVibroacousticSession,
    stopVibroacousticSession,
    setVibroacousticIntensity,
    setHapticSensitivity,
    setBinauralIntensity,
    setIsochronicIntensity,
    isVibroacousticActive,
    currentPattern,
    intensity,
    hapticSensitivity,
    binauralIntensity,
    isochronicIntensity,
    generateBinauralBeat,
    playHealingFrequency,
    playIsochronicTone,
  ]);
});