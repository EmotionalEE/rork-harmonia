import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  Alert,
  ScrollView,
  useWindowDimensions,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Play,
  Pause,
  Vibrate,
  Waves,
  CodeSquare,
  SkipBack,
  SkipForward,
} from "lucide-react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { sessions } from "@/constants/sessions";
import { useAudio } from "@/providers/AudioProvider";
import { useUserProgress } from "@/providers/UserProgressProvider";
import { useVibroacoustic } from "@/providers/VibroacousticProvider";
import { SynchroGeometry, SacredGeometry } from "@/components/SessionGeometry";
import { VibroacousticControls, BinauralControls, IsochronicControls } from "@/components/SessionAudioControls";
import * as Haptics from "expo-haptics";

export default function SessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const { preloadSound, playSound, pauseSound, stopSound, isPlaying, seekTo, getCurrentPosition, getDuration, getPlaybackRate } = useAudio();
  const { addSession } = useUserProgress();
  const {
    startVibroacousticSession,
    stopVibroacousticSession,
    triggerHapticPattern,
    setVibroacousticIntensity,
    setHapticSensitivity,
    isVibroacousticActive,
    intensity,
    hapticSensitivity,
    playSolfeggio,
    generateBinauralBeat,
    setBinauralIntensity,
    setIsochronicIntensity,
    binauralIntensity,
    isochronicIntensity,
    playIsochronicTone,
  } = useVibroacoustic();
  
  const { width, height } = useWindowDimensions();
  const session = useMemo(() => sessions.find((s) => s.id === sessionId), [sessionId]);

  const sessionAudioUrl = useMemo(() => {
    const fallback = session?.audioUrl;
    const sources = session?.audioSources;
    if (!sources || sources.length === 0) return fallback;

    if (Platform.OS !== "web") {
      return sources[0]?.url ?? fallback;
    }

    try {
      const canPlay = (url: string, mime?: string) => {
        if (typeof window === "undefined") return true;
        const a = document.createElement("audio");
        if (mime) {
          const res = a.canPlayType(mime);
          return res === "probably" || res === "maybe";
        }
        const lower = url.toLowerCase();
        if (lower.endsWith(".mp3")) return true;
        if (lower.endsWith(".wav")) return true;
        if (lower.endsWith(".m4a") || lower.endsWith(".mp4")) {
          const res = a.canPlayType("audio/mp4");
          return res === "probably" || res === "maybe";
        }
        return true;
      };

      const preferred = sources.find((s) => canPlay(s.url, s.mime));
      return preferred?.url ?? sources[0]?.url ?? fallback;
    } catch {
      return sources[0]?.url ?? fallback;
    }
  }, [session]);

  const isMobilePlatform = Platform.OS !== 'web';
  const synchroSize = useMemo(() => Math.min(width, height) * 0.9, [width, height]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isStartingPlayback, setIsStartingPlayback] = useState<boolean>(false);
  const seekCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommittedSeekSecRef = useRef<number>(-1);
  const [, setIsAnimating] = useState<boolean>(false);
  const [showVibroacousticControls, setShowVibroacousticControls] = useState(false);
  const [selectedVibroacousticMode, setSelectedVibroacousticMode] = useState<string>('meditation');
  const [showBinauralControls, setShowBinauralControls] = useState(false);
  const [binauralBaseFreq, setBinauralBaseFreq] = useState(200);
  const [binauralBeatFreq, setBinauralBeatFreq] = useState(10);
  const [showIsochronicControls, setShowIsochronicControls] = useState(false);
  const [isochronicFreq, setIsochronicFreq] = useState(10);
  const [isBinauralActive, setIsBinauralActive] = useState(false);
  const [isIsochronicActive, setIsIsochronicActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(0)).current;
  const geometryAnim = useRef(new Animated.Value(0)).current;
  const mandalaAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const waveLoop = useRef<Animated.CompositeAnimation | null>(null);
  const geometryLoop = useRef<Animated.CompositeAnimation | null>(null);
  const mandalaLoop = useRef<Animated.CompositeAnimation | null>(null);
  const breathLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateRevAnim = useRef(new Animated.Value(0)).current;
  const breatheScaleAnim = useRef(new Animated.Value(0.98)).current;
  const centerPulseAnim = useRef(new Animated.Value(10)).current;
  const bgShiftLoop = useRef<Animated.CompositeAnimation | null>(null);
  const rotateLoop = useRef<Animated.CompositeAnimation | null>(null);
  const rotateRevLoop = useRef<Animated.CompositeAnimation | null>(null);
  const breatheLoop = useRef<Animated.CompositeAnimation | null>(null);
  const centerPulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const shouldAnimateSynchroRef = useRef(false);

  const stopSynchroLoops = useCallback(() => {
    bgShiftLoop.current?.stop();
    rotateLoop.current?.stop();
    rotateRevLoop.current?.stop();
    breatheLoop.current?.stop();
    centerPulseLoop.current?.stop();
    bgShiftAnim.stopAnimation();
    rotateAnim.stopAnimation();
    rotateRevAnim.stopAnimation();
    breatheScaleAnim.stopAnimation();
    centerPulseAnim.stopAnimation();
  }, [bgShiftAnim, rotateAnim, rotateRevAnim, breatheScaleAnim, centerPulseAnim]);

  const stopGeometryLoops = useCallback(() => {
    pulseLoop.current?.stop();
    waveLoop.current?.stop();
    geometryLoop.current?.stop();
    mandalaLoop.current?.stop();
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    geometryAnim.stopAnimation();
    mandalaAnim.stopAnimation();
  }, [pulseAnim, waveAnim, geometryAnim, mandalaAnim]);

  const startSynchroLoop = useCallback((
    loopRef: React.MutableRefObject<Animated.CompositeAnimation | null>,
    animationFactory: () => Animated.CompositeAnimation,
  ) => {
    loopRef.current?.stop();
    const run = () => {
      const animation = animationFactory();
      loopRef.current = animation;
      animation.start(({ finished }) => {
        if (finished && shouldAnimateSynchroRef.current) {
          run();
        }
      });
    };
    run();
  }, []);

  const [sliderWidth, setSliderWidth] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubSeconds, setScrubSeconds] = useState<number>(0);
  const [trackDurationSec, setTrackDurationSec] = useState<number | null>(null);
  const effectiveDurationSec = useMemo(
    () => trackDurationSec ?? (session ? session.duration * 60 : 0),
    [trackDurationSec, session],
  );
  const lastHapticTickBucketRef = useRef<number | null>(null);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1);
  const beatDurationMs = useMemo(() => {
    const tempo = session?.tempoBpm && session.tempoBpm > 0 ? session.tempoBpm : 72;
    const rate = audioPlaybackRate > 0 ? audioPlaybackRate : 1;
    return 60000 / tempo / rate;
  }, [session?.tempoBpm, audioPlaybackRate]);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const hasAutoScrolledRef = useRef<boolean>(false);
  const initialViewportHeightRef = useRef<number>(height);
  const shouldAnimate = useMemo(() => !isPaused, [isPaused]);
  const isSynchroSession = session?.id === 'lifting-from-sadness';
  const isDissolutionOfAnxiousness = session?.id === 'dissolution-anxiousness';
  const isDynamicEnergyFlow = session?.id === 'dynamic-energy-flow';
  const isWelcomeIntroSession = session?.id === 'welcome-intro';
  const isMobileBinauralLocked = Boolean(isMobilePlatform && (isDynamicEnergyFlow || isWelcomeIntroSession));
  const canUseBinauralOnThisDevice = !isMobilePlatform || isMobileBinauralLocked;
  const visualStatusRef = useRef({
    active: false,
    sessionId: null as string | null,
    mode: null as 'synchro' | 'geometry' | null,
    tempoKey: null as number | null,
  });

  useEffect(() => {
    if (!session) return;
    if (isDynamicEnergyFlow) {
      setBinauralBaseFreq(220);
      setBinauralBeatFreq(18);
    } else if (isWelcomeIntroSession) {
      setBinauralBaseFreq(200);
      setBinauralBeatFreq(12);
    } else {
      setBinauralBaseFreq(200);
      setBinauralBeatFreq(10);
    }
  }, [session, isDynamicEnergyFlow, isWelcomeIntroSession]);

  useEffect(() => {
    hasAutoScrolledRef.current = false;
    initialViewportHeightRef.current = height;
  }, [sessionId, height]);

  useEffect(() => {
    if (hasAutoScrolledRef.current) return;
    const frame = requestAnimationFrame(() => {
      if (!scrollViewRef.current) return;
      scrollViewRef.current.scrollTo({ x: 0, y: initialViewportHeightRef.current, animated: false });
      hasAutoScrolledRef.current = true;
    });
    return () => { cancelAnimationFrame(frame); };
  }, [sessionId]);

  const stopBreathLoop = useCallback(() => {
    breathLoopRef.current?.stop();
    breathAnim.stopAnimation();
    breathAnim.setValue(0);
  }, [breathAnim]);

  useEffect(() => {
    if (!session) return;
    if (!shouldAnimate) { stopBreathLoop(); return; }

    breathLoopRef.current?.stop();
    breathAnim.setValue(0);

    const breathAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.delay(350),
        Animated.timing(breathAnim, { toValue: 0, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.delay(350),
      ]),
    );

    breathLoopRef.current = breathAnimation;
    breathAnimation.start();

    return () => { breathLoopRef.current?.stop(); };
  }, [session, shouldAnimate, breathAnim, stopBreathLoop]);

  useEffect(() => {
    return () => {
      shouldAnimateSynchroRef.current = false;
      stopSynchroLoops();
      stopGeometryLoops();
      stopBreathLoop();
      visualStatusRef.current = { active: false, sessionId: null, mode: null, tempoKey: null };
    };
  }, [stopSynchroLoops, stopGeometryLoops, stopBreathLoop]);

  useEffect(() => {
    if (!session) return;

    const mode: 'synchro' | 'geometry' | null = !shouldAnimate
      ? null
      : isSynchroSession
        ? 'synchro'
        : 'geometry';

    if (!mode) {
      if (visualStatusRef.current.active) {
        shouldAnimateSynchroRef.current = false;
        stopSynchroLoops();
        stopGeometryLoops();
        visualStatusRef.current = { active: false, sessionId: null, mode: null, tempoKey: null };
      }
      return;
    }

    const tempoKey = mode === 'synchro'
      ? Math.round(beatDurationMs)
      : Math.round((audioPlaybackRate || 1) * 1000);

    const shouldRestart =
      !visualStatusRef.current.active ||
      visualStatusRef.current.sessionId !== session.id ||
      visualStatusRef.current.mode !== mode ||
      visualStatusRef.current.tempoKey !== tempoKey;

    if (!shouldRestart) return;

    shouldAnimateSynchroRef.current = mode === 'synchro';
    stopSynchroLoops();
    stopGeometryLoops();

    if (mode === 'synchro') {
      console.log('[Session] Starting Synchrotrometry animations');
      const safeBeatMs = Math.max(250, Math.min(beatDurationMs, 6000));

      bgShiftAnim.setValue(0);
      rotateAnim.setValue(0);
      rotateRevAnim.setValue(0);
      breatheScaleAnim.setValue(0.98);
      centerPulseAnim.setValue(10);

      startSynchroLoop(bgShiftLoop, () =>
        Animated.sequence([
          Animated.timing(bgShiftAnim, { toValue: 1, duration: safeBeatMs * 12, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(bgShiftAnim, { toValue: 0, duration: safeBeatMs * 12, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
      );

      startSynchroLoop(rotateLoop, () =>
        Animated.timing(rotateAnim, { toValue: 1, duration: safeBeatMs * 64, easing: Easing.linear, useNativeDriver: false }),
      );

      startSynchroLoop(rotateRevLoop, () =>
        Animated.timing(rotateRevAnim, { toValue: 1, duration: safeBeatMs * 52, easing: Easing.linear, useNativeDriver: false }),
      );

      startSynchroLoop(breatheLoop, () =>
        Animated.sequence([
          Animated.timing(breatheScaleAnim, { toValue: 1.04, duration: safeBeatMs * 4, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(breatheScaleAnim, { toValue: 0.97, duration: safeBeatMs * 4, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
      );

      startSynchroLoop(centerPulseLoop, () =>
        Animated.sequence([
          Animated.timing(centerPulseAnim, { toValue: 16, duration: safeBeatMs * 2, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(centerPulseAnim, { toValue: 10, duration: safeBeatMs * 2, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
      );
    } else {
      console.log('[Session] Starting sacred geometry animations');
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
      geometryAnim.setValue(0);
      mandalaAnim.setValue(0);

      const tempoMultiplier = 1 / (audioPlaybackRate || 1);
      const basePulseDuration = isDissolutionOfAnxiousness ? 1500 : 2000;
      const baseWaveDuration = isDissolutionOfAnxiousness ? 2500 : 3000;
      const baseGeometryDuration = isDissolutionOfAnxiousness ? 6000 : 8000;
      const baseMandalaDuration = isDissolutionOfAnxiousness ? 10000 : 12000;

      pulseLoop.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: basePulseDuration * tempoMultiplier, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: basePulseDuration * tempoMultiplier, useNativeDriver: false }),
      ]));
      pulseLoop.current.start();

      waveLoop.current = Animated.loop(Animated.timing(waveAnim, { toValue: 1, duration: baseWaveDuration * tempoMultiplier, useNativeDriver: false }));
      waveLoop.current.start();

      geometryLoop.current = Animated.loop(Animated.sequence([
        Animated.timing(geometryAnim, { toValue: 1, duration: baseGeometryDuration * tempoMultiplier, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(geometryAnim, { toValue: 0, duration: baseGeometryDuration * tempoMultiplier, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]));
      geometryLoop.current.start();

      mandalaLoop.current = Animated.loop(Animated.sequence([
        Animated.timing(mandalaAnim, { toValue: 1, duration: baseMandalaDuration * tempoMultiplier, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(mandalaAnim, { toValue: 0, duration: baseMandalaDuration * tempoMultiplier, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]));
      mandalaLoop.current.start();
    }

    visualStatusRef.current = { active: true, sessionId: session.id, mode, tempoKey };
  }, [
    session, shouldAnimate, isSynchroSession, isDissolutionOfAnxiousness,
    beatDurationMs, audioPlaybackRate, startSynchroLoop, stopSynchroLoops, stopGeometryLoops,
    pulseAnim, waveAnim, geometryAnim, mandalaAnim,
    bgShiftAnim, rotateAnim, rotateRevAnim, breatheScaleAnim, centerPulseAnim,
  ]);

  const handleComplete = useCallback(async () => {
    console.log('[Session] Completing session', session?.id);
    const completionTimestamp = new Date().toISOString();

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await triggerHapticPattern('healing_resonance');
    }

    const durationMinutes = session ? Math.max(1, Math.floor((timeElapsed || 0) / 60)) : 0;

    if (session) {
      try {
        await addSession(session.id, durationMinutes);
        console.log('[Session] Progress updated for', session.id);
      } catch (error) {
        console.error('[Session] Failed to log progress', error);
      }
    }

    try { await stopSound(); } catch (error) { console.error('[Session] Error stopping sound', error); }
    try { await stopVibroacousticSession(); } catch (error) { console.error('[Session] Error stopping vibroacoustic session', error); }

    if (session) {
      router.replace({
        pathname: '/end-reflection' as any,
        params: { sessionId: session.id, sessionName: session.title, completedAt: completionTimestamp },
      });
    } else {
      router.replace('/');
    }
  }, [session, timeElapsed, addSession, stopSound, stopVibroacousticSession, triggerHapticPattern, router]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!session) return;

    const tick = async () => {
      try {
        const pos = await getCurrentPosition();
        const secs = Math.floor((pos ?? 0) / 1000);
        if (!isScrubbing) setTimeElapsed(secs);
        const fallbackDuration = session.duration * 60;
        const targetDuration = trackDurationSec ?? fallbackDuration;
        if (targetDuration > 0 && secs >= targetDuration) {
          handleComplete();
        }
      } catch {}
    };

    if (!isPaused) {
      interval = setInterval(tick, 500);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPaused, session, handleComplete, getCurrentPosition, isScrubbing, trackDurationSec]);

  useEffect(() => {
    if (!session) return;
    const url = sessionAudioUrl ?? session.audioUrl;
    if (!url) return;
    console.log('[Session] Preloading audio', { sessionId: session.id, url });
    preloadSound(url).catch((e: any) => { console.log('[Session] preload error', e); });
  }, [preloadSound, session, sessionAudioUrl]);

  useEffect(() => {
    return () => {
      if (seekCommitTimerRef.current) {
        clearTimeout(seekCommitTimerRef.current);
        seekCommitTimerRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isPlaying) {
      await pauseSound();
      setIsPaused(true);
      setIsAnimating(false);
      return;
    }

    if (!session) return;
    const url = sessionAudioUrl ?? session.audioUrl;
    if (!url) return;

    try {
      setIsStartingPlayback(true);
      setIsAnimating(true);
      setIsPaused(false);
      await playSound(url);
    } catch (e: any) {
      console.error('[Session] play error:', e);
      setIsAnimating(false);
      setIsPaused(true);
      const errorMsg = e?.message || 'Could not start playback';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert(`Playback Error: ${errorMsg}. The audio file may not be compatible or accessible.`);
        }
      } else {
        Alert.alert('Playback Error', `${errorMsg}. The audio file may not be compatible or accessible. Please try a different session.`);
      }
    } finally {
      setIsStartingPlayback(false);
    }
  }, [isPlaying, pauseSound, playSound, session, sessionAudioUrl]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const updater = async () => {
      try {
        const dur = await getDuration();
        if (dur && !Number.isNaN(dur) && dur > 0) {
          setTrackDurationSec(Math.floor(dur / 1000));
        }
        const rate = await getPlaybackRate?.();
        if (rate && rate > 0) {
          setAudioPlaybackRate(rate);
        }
      } catch {}
    };
    interval = setInterval(updater, 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [getDuration, getPlaybackRate]);

  const handleSeek = useCallback(async (seconds: number) => {
    if (!isPlaying && isPaused) return;
    try {
      const currentPosition = await getCurrentPosition();
      const newPosition = Math.max(0, currentPosition + (seconds * 1000));
      await seekTo(newPosition);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, [isPlaying, isPaused, seekTo, getCurrentPosition]);

  const clamp = useCallback((n: number, min: number, max: number) => Math.max(min, Math.min(max, n)), []);

  const seekToSeconds = useCallback(async (secondsAbs: number) => {
    try {
      const fallback = session ? session.duration * 60 : secondsAbs;
      const maxSec = trackDurationSec ?? fallback;
      const upperBound = maxSec > 0 ? maxSec : secondsAbs;
      const bounded = clamp(secondsAbs, 0, upperBound);
      const rounded = Math.round(bounded);

      if (rounded === lastCommittedSeekSecRef.current) {
        setTimeElapsed(rounded);
        return;
      }

      lastCommittedSeekSecRef.current = rounded;
      await seekTo(rounded * 1000);
      setTimeElapsed(rounded);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.log('Seek error', e);
    }
  }, [seekTo, clamp, session, trackDurationSec]);

  const handleClose = useCallback(() => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm('Are you sure you want to end this session?');
      if (confirmed) {
        void (async () => {
          try {
            await stopSound();
            await stopVibroacousticSession();
          } catch (e) {
            console.log('[Session] Close error', e);
          } finally {
            router.replace('/');
          }
        })();
      }
      return;
    }

    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          try {
            await stopSound();
            await stopVibroacousticSession();
          } catch (e) {
            console.log('[Session] stop session error', e);
          } finally {
            router.back();
          }
        },
      },
    ]);
  }, [stopSound, stopVibroacousticSession, router]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const maxSeconds = useMemo(() => effectiveDurationSec, [effectiveDurationSec]);
  const displaySeconds = useMemo(() => isScrubbing ? scrubSeconds : timeElapsed, [isScrubbing, scrubSeconds, timeElapsed]);
  const displayProgress = useMemo(() => (maxSeconds > 0 ? (displaySeconds / maxSeconds) * 100 : 0), [displaySeconds, maxSeconds]);
  const sliderThumbLeft = useMemo(() => {
    if (!sliderWidth || maxSeconds <= 0) return 0;
    const usableWidth = Math.max(0, sliderWidth - 18);
    const ratio = Math.min(Math.max(displaySeconds / maxSeconds, 0), 1);
    return ratio * usableWidth;
  }, [sliderWidth, maxSeconds, displaySeconds]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (!sliderWidth) return;
      setIsScrubbing(true);
      const x = evt.nativeEvent.locationX;
      const ratio = clamp(x / sliderWidth, 0, 1);
      const sec = Math.round(ratio * maxSeconds);
      setScrubSeconds(sec);

      if (seekCommitTimerRef.current) {
        clearTimeout(seekCommitTimerRef.current);
        seekCommitTimerRef.current = null;
      }

      const bucket = Math.floor(sec / 5);
      if (bucket !== lastHapticTickBucketRef.current) {
        lastHapticTickBucketRef.current = bucket;
        if (Platform.OS !== 'web') {
          Haptics.selectionAsync().catch(() => {});
        }
      }
    },
    onPanResponderMove: (evt) => {
      if (!sliderWidth) return;
      const x = evt.nativeEvent.locationX;
      const ratio = clamp(x / sliderWidth, 0, 1);
      const sec = Math.round(ratio * maxSeconds);
      setScrubSeconds(sec);

      if (seekCommitTimerRef.current) {
        clearTimeout(seekCommitTimerRef.current);
      }
      seekCommitTimerRef.current = setTimeout(() => {
        void seekToSeconds(sec);
      }, 140);

      const bucket = Math.floor(sec / 5);
      if (bucket !== lastHapticTickBucketRef.current) {
        lastHapticTickBucketRef.current = bucket;
        if (Platform.OS !== 'web') {
          Haptics.selectionAsync().catch(() => {});
        }
      }
    },
    onPanResponderRelease: () => {
      setIsScrubbing(false);
      if (seekCommitTimerRef.current) {
        clearTimeout(seekCommitTimerRef.current);
        seekCommitTimerRef.current = null;
      }
      const snapped = Math.round((scrubSeconds ?? 0) / 5) * 5;
      const bounded = clamp(snapped, 0, maxSeconds);
      setScrubSeconds(bounded);
      lastHapticTickBucketRef.current = null;
      void seekToSeconds(bounded);
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderTerminate: () => {
      setIsScrubbing(false);
      lastHapticTickBucketRef.current = null;
      if (seekCommitTimerRef.current) {
        clearTimeout(seekCommitTimerRef.current);
        seekCommitTimerRef.current = null;
      }
    },
  }), [sliderWidth, maxSeconds, clamp, scrubSeconds, seekToSeconds]);

  const exitButtonColor = useMemo(() => {
    if (!session || !session.gradient || session.gradient.length === 0) return '#ffffff';
    const gradientColors = session.gradient as string[];
    return gradientColors[0];
  }, [session]);

  const exitAccentColor = useMemo(() => {
    if (!session || !session.gradient || session.gradient.length < 2) return '#ffffff';
    const gradientColors = session.gradient as string[];
    return gradientColors[gradientColors.length - 1];
  }, [session]);

  const handleVibroacousticToggle = useCallback(async () => {
    if (isVibroacousticActive) {
      await stopVibroacousticSession();
    } else {
      await startVibroacousticSession(selectedVibroacousticMode);
      const frequency = parseInt(session?.frequency ?? '0');
      if (frequency < 100) {
        await generateBinauralBeat(200, frequency);
      } else {
        await playSolfeggio(frequency);
      }
    }
  }, [isVibroacousticActive, stopVibroacousticSession, startVibroacousticSession, selectedVibroacousticMode, session, generateBinauralBeat, playSolfeggio]);

  const handleBinauralToggle = useCallback(async () => {
    if (isBinauralActive) {
      await stopVibroacousticSession();
      setIsBinauralActive(false);
    } else {
      const baseFreq = isDynamicEnergyFlow ? 220 : 200;
      const beatFreq = isDynamicEnergyFlow ? 18 : isWelcomeIntroSession ? 12 : binauralBeatFreq;
      await generateBinauralBeat(baseFreq, beatFreq);
      setIsBinauralActive(true);
    }
  }, [isBinauralActive, stopVibroacousticSession, isDynamicEnergyFlow, isWelcomeIntroSession, binauralBeatFreq, generateBinauralBeat]);

  const handleIsochronicToggle = useCallback(async () => {
    if (isIsochronicActive) {
      await stopVibroacousticSession();
      setIsIsochronicActive(false);
    } else {
      await playIsochronicTone(isochronicFreq, 'square');
      setIsIsochronicActive(true);
    }
  }, [isIsochronicActive, stopVibroacousticSession, isochronicFreq, playIsochronicTone]);

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  const geometryBreathScale = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.20] });
  const geometryBreathOpacity = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.66, 1] });
  const geometryGlowOpacity = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.6] });

  return (
    <LinearGradient colors={session.gradient as unknown as readonly [string, string, ...string[]]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.exitButton}
          accessibilityRole="button"
          accessibilityLabel="Exit session"
          testID="close-session-button"
          activeOpacity={0.7}
        >
          <Animated.View style={[styles.exitGeometry, {
            opacity: breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0.9] }),
            transform: [{ scale: breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }]
          }]}>
            <Svg width={64} height={64} viewBox="0 0 64 64" style={styles.exitSvg}>
              <Circle cx={32} cy={32} r={30} fill="rgba(0,0,0,0.1)" />
              <Circle cx={32} cy={32} r={30} fill="none" stroke={exitButtonColor} strokeWidth={2} opacity={0.4} />
              <Circle cx={32} cy={32} r={24} fill="none" stroke={exitAccentColor} strokeWidth={1.5} opacity={0.3} />
              <Circle cx={32} cy={32} r={18} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
              <Path d="M 22 22 L 42 42" stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} strokeLinecap="round" />
              <Path d="M 42 22 L 22 42" stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} strokeLinecap="round" />
              <Circle cx={32} cy={32} r={6} fill="none" stroke={exitAccentColor} strokeWidth={1.2} opacity={0.35} />
            </Svg>
          </Animated.View>
        </TouchableOpacity>

        <View pointerEvents="none" style={styles.backgroundLayer} testID="background-geometry">
          {session.id === 'lifting-from-sadness' ? (
            <SynchroGeometry
              synchroSize={synchroSize}
              breatheScaleAnim={breatheScaleAnim}
              rotateAnim={rotateAnim}
              rotateRevAnim={rotateRevAnim}
            />
          ) : (
            <SacredGeometry
              geometryBreathScale={geometryBreathScale}
              geometryBreathOpacity={geometryBreathOpacity}
              geometryGlowOpacity={geometryGlowOpacity}
              geometryAnim={geometryAnim}
              mandalaAnim={mandalaAnim}
            />
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: initialViewportHeightRef.current }} />
          <View style={styles.sheet} testID="session-info-sheet">
            <View style={styles.sheetHandle} testID="session-sheet-handle" />
            <View style={styles.sheetContent}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.frequency}>{session.frequency}Hz</Text>
              <Text style={styles.description}>{session.description}</Text>

              <View style={styles.progressContainer} testID="session-progress">
                <View
                  style={styles.progressBar}
                  onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                  {...panResponder.panHandlers}
                  testID="seek-slider"
                >
                  <View style={{ position: 'absolute', top: 17, left: 0, height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }} />
                  <View style={[styles.progressFill, { width: `${displayProgress}%` }]} />
                  <View style={[styles.thumb, { left: sliderThumbLeft }]} />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(displaySeconds)}</Text>
                  <Text style={styles.timeText}>{formatTime(maxSeconds)}</Text>
                </View>
              </View>

              <View style={styles.controls} testID="session-controls">
                <View style={styles.seekControls}>
                  <TouchableOpacity onPress={() => handleSeek(-10)} style={styles.seekButton} activeOpacity={0.8} disabled={isPaused} testID="seek-back-button">
                    <SkipBack size={24} color={!isPaused ? "#fff" : "rgba(255,255,255,0.4)"} />
                    <Text style={[styles.seekText, isPaused && styles.seekTextDisabled]}>10s</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handlePlayPause} style={styles.playButton} activeOpacity={0.8} testID="play-pause-button" disabled={isStartingPlayback}>
                    <LinearGradient colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]} style={styles.playButtonGradient}>
                      {isPlaying ? <Pause size={40} color="#fff" /> : <Play size={40} color="#fff" style={{ marginLeft: 4 }} />}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleSeek(10)} style={styles.seekButton} activeOpacity={0.8} disabled={isPaused} testID="seek-forward-button">
                    <SkipForward size={24} color={!isPaused ? "#fff" : "rgba(255,255,255,0.4)"} />
                    <Text style={[styles.seekText, isPaused && styles.seekTextDisabled]}>10s</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showVibroacousticControls && (
                <VibroacousticControls
                  selectedMode={selectedVibroacousticMode}
                  onSelectMode={setSelectedVibroacousticMode}
                  intensity={intensity}
                  onSetIntensity={setVibroacousticIntensity}
                  hapticSensitivity={hapticSensitivity}
                  onSetHapticSensitivity={setHapticSensitivity}
                  isActive={isVibroacousticActive}
                  onToggle={handleVibroacousticToggle}
                />
              )}

              {showBinauralControls && (
                <BinauralControls
                  binauralIntensity={binauralIntensity}
                  onSetBinauralIntensity={setBinauralIntensity}
                  isBinauralActive={isBinauralActive}
                  binauralBaseFreq={binauralBaseFreq}
                  onSetBaseFreq={setBinauralBaseFreq}
                  binauralBeatFreq={binauralBeatFreq}
                  onSetBeatFreq={setBinauralBeatFreq}
                  isMobileBinauralLocked={isMobileBinauralLocked}
                  canUseBinauralOnThisDevice={canUseBinauralOnThisDevice}
                  onToggle={handleBinauralToggle}
                />
              )}

              {showIsochronicControls && (
                <IsochronicControls
                  isochronicIntensity={isochronicIntensity}
                  onSetIsochronicIntensity={setIsochronicIntensity}
                  isIsochronicActive={isIsochronicActive}
                  isochronicFreq={isochronicFreq}
                  onSetIsochronicFreq={setIsochronicFreq}
                  onToggle={handleIsochronicToggle}
                />
              )}

              <View style={styles.infoCards}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Vibroacoustic controls"
                  onPress={() => setShowVibroacousticControls((v) => !v)}
                  style={[styles.infoIcon, isVibroacousticActive && styles.infoIconActive]}
                  testID="icon-vibroacoustic"
                  activeOpacity={0.8}
                >
                  <Vibrate size={22} color={isVibroacousticActive ? "#0f0" : "#fff"} />
                  <Text style={styles.infoIconText}>Vibro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Binaural beats controls"
                  onPress={() => setShowBinauralControls((v) => !v)}
                  style={[styles.infoIcon, isBinauralActive && styles.infoIconActive]}
                  testID="icon-binaural"
                  activeOpacity={0.8}
                >
                  <Waves size={22} color={isBinauralActive ? "#0f0" : "#fff"} />
                  <Text style={styles.infoIconText}>Binaural</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Isochronic tones controls"
                  onPress={() => setShowIsochronicControls((v) => !v)}
                  style={[styles.infoIcon, isIsochronicActive && styles.infoIconActive]}
                  testID="icon-isochronic"
                  activeOpacity={0.8}
                >
                  <CodeSquare size={22} color={isIsochronicActive ? "#0f0" : "#fff"} />
                  <Text style={styles.infoIconText}>Iso</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  exitButton: {
    position: "absolute" as const,
    top: 50,
    right: 16,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  exitGeometry: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exitSvg: {
    shadowColor: "rgba(255,255,255,0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    minHeight: 1,
  },
  sheet: {
    marginHorizontal: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: "rgba(20, 24, 30, 0.32)",
    paddingBottom: 36,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 64,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  sheetContent: {
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  sessionTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  frequency: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: "100%",
    marginBottom: 40,
  },
  progressBar: {
    height: 40,
    backgroundColor: "transparent",
    borderRadius: 3,
    marginBottom: 10,
    justifyContent: "center",
  },
  progressFill: {
    height: 6,
    backgroundColor: "#fff",
    borderRadius: 3,
    position: "absolute",
    top: 17,
    left: 0,
  },
  thumb: {
    position: "absolute",
    top: 11,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  controls: {
    marginBottom: 40,
  },
  seekControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  seekButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    minWidth: 70,
  },
  seekText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600" as const,
    marginTop: 4,
  },
  seekTextDisabled: {
    color: "rgba(255,255,255,0.4)",
  },
  playButton: {
    width: 80,
    height: 80,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCards: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  infoIcon: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  infoIconActive: {
    backgroundColor: "rgba(0,255,150,0.25)",
  },
  infoIconText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
