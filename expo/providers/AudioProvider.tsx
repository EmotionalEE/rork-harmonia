import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import createContextHook from "@nkzw/create-context-hook";

function normalizeAudioUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);

    if (u.hostname === "www.dropbox.com" || u.hostname === "dropbox.com") {
      u.hostname = "dl.dropboxusercontent.com";
      u.searchParams.delete("dl");
      if (!u.searchParams.has("raw")) {
        u.searchParams.set("raw", "1");
      }
      u.searchParams.delete("st");
      return u.toString();
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

interface AudioContextType {
  preloadSound: (url: string) => Promise<void>;
  playSound: (url: string) => Promise<void>;
  pauseSound: () => Promise<void>;
  stopSound: () => Promise<void>;
  isPlaying: boolean;
  setVolume: (volume: number) => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
  getCurrentPosition: () => Promise<number>;
  getDuration: () => Promise<number>;
  getPlaybackRate?: () => Promise<number>;
}

export const [AudioProvider, useAudio] = createContextHook<AudioContextType>(() => {
  const [, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentUrlRef = useRef<string | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSeekingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.log("Audio mode setup error:", e);
      }
    })();

    return () => {
      const activeSound = soundRef.current;
      if (activeSound) {
        activeSound
          .getStatusAsync()
          .then((status) => {
            if (status.isLoaded) {
              activeSound.unloadAsync().catch((error) => {
                console.log("Error unloading sound on cleanup:", error);
              });
            }
          })
          .catch((error) => {
            console.log("Error getting sound status on cleanup:", error);
          });
      }
      if (webAudioRef.current) {
        try {
          webAudioRef.current.pause();
          webAudioRef.current.src = "";
        } catch {}
        webAudioRef.current = null;
      }
      soundRef.current = null;
    };
  }, []);

  const attachStatusHandler = useCallback((s: Audio.Sound) => {
    s.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying);
      } else {
        if ((status as any).error) {
          console.error("Sound loading error:", (status as any).error);
        }
        setIsPlaying(false);
      }
    });
  }, []);

  const cleanupLoadedSound = useCallback(async () => {
    const activeSound = soundRef.current;
    if (!activeSound) return;
    try {
      const status = await activeSound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await activeSound.stopAsync();
        }
        await activeSound.unloadAsync();
      }
    } catch (error) {
      console.log("Error cleaning up previous sound:", error);
    } finally {
      soundRef.current = null;
      setSound(null);
      currentUrlRef.current = null;
    }
  }, []);

  const preloadSound = useCallback(async (url: string) => {
    const normalizedUrl = normalizeAudioUrl(url);

    try {
      if (Platform.OS === "web") {
        if (webAudioRef.current && currentUrlRef.current === normalizedUrl) {
          return;
        }

        try {
          if (webAudioRef.current) {
            webAudioRef.current.pause();
            webAudioRef.current.src = "";
            webAudioRef.current = null;
          }

          console.log("[Audio] (web) Preloading:", normalizedUrl);
          const a = new window.Audio();
          a.src = normalizedUrl;
          a.loop = true;
          a.preload = "auto";
          a.crossOrigin = "anonymous";
          a.volume = 1;
          a.load();
          webAudioRef.current = a;
          currentUrlRef.current = normalizedUrl;
          return;
        } catch (err) {
          console.log("[Audio] (web) preload failed, falling back to expo-av:", err);
        }
      }

      const existingSound = soundRef.current;
      if (existingSound && currentUrlRef.current === normalizedUrl) {
        const st = await existingSound.getStatusAsync();
        if (st.isLoaded) {
          return;
        }
      }

      await cleanupLoadedSound();

      console.log("[Audio] Preloading sound from:", normalizedUrl);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: normalizedUrl },
        {
          shouldPlay: false,
          isLooping: true,
          volume: 1,
          androidImplementation: "ExoPlayer",
        }
      );

      soundRef.current = newSound;
      setSound(newSound);
      currentUrlRef.current = normalizedUrl;
      attachStatusHandler(newSound);
    } catch (error) {
      console.error("[Audio] Error preloading sound:", error);
      throw error;
    }
  }, [attachStatusHandler, cleanupLoadedSound]);

  const playSound = useCallback(async (url: string) => {
    const normalizedUrl = normalizeAudioUrl(url);
    try {
      if (Platform.OS === "web") {
        try {
          if (!webAudioRef.current || currentUrlRef.current !== normalizedUrl) {
            await preloadSound(normalizedUrl);
          }

          if (webAudioRef.current) {
            console.log("[Audio] (web) Play:", normalizedUrl);
            await webAudioRef.current.play();
            setIsPlaying(true);
            return;
          }
        } catch (err) {
          try {
            if (webAudioRef.current) {
              webAudioRef.current.pause();
              webAudioRef.current.currentTime = 0;
            }
          } catch {}
          console.log("HTMLAudioElement play failed, falling back to expo-av:", err);
        }
      }

      let activeSound: Audio.Sound | null = soundRef.current;
      if (!activeSound || currentUrlRef.current !== normalizedUrl) {
        await preloadSound(normalizedUrl);
        activeSound = soundRef.current;
      }

      if (activeSound) {
        const status = await activeSound.getStatusAsync();
        if (status.isLoaded) {
          if (!status.isPlaying) {
            await activeSound.playAsync();
          }
          setIsPlaying(true);
          return;
        }
      }

      await cleanupLoadedSound();

      console.log("[Audio] Loading+Playing sound from:", normalizedUrl);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: normalizedUrl },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1,
          androidImplementation: "ExoPlayer",
        }
      );

      soundRef.current = newSound;
      setSound(newSound);
      currentUrlRef.current = normalizedUrl;
      setIsPlaying(true);
      attachStatusHandler(newSound);
    } catch (error) {
      console.error("Error playing sound:", error);
      throw error;
    }
  }, [attachStatusHandler, cleanupLoadedSound, preloadSound]);

  const pauseSound = useCallback(async () => {
    try {
      if (Platform.OS === "web" && webAudioRef.current) {
        webAudioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      const activeSound = soundRef.current;
      if (activeSound) {
        const status = await activeSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await activeSound.pauseAsync();
        }
      }
    } catch (error) {
      console.error("Error pausing sound:", error);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const stopSound = useCallback(async () => {
    stopRequestedRef.current = true;

    if (isSeekingRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    try {
      if (Platform.OS === "web" && webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = "";
        webAudioRef.current = null;
        currentUrlRef.current = null;
      }
      const activeSound = soundRef.current;
      if (activeSound) {
        try {
          const status = await activeSound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await activeSound.stopAsync();
            }
            await activeSound.unloadAsync();
          }
        } catch (innerError: any) {
          if (innerError?.message?.includes("Seeking interrupted")) {
            console.log("Seek operation interrupted during stop - this is expected");
          } else {
            throw innerError;
          }
        }
        soundRef.current = null;
        setSound(null);
        currentUrlRef.current = null;
      }
    } catch (error: any) {
      if (!error?.message?.includes("Seeking interrupted")) {
        console.error("Error stopping sound:", error);
      }
    } finally {
      setIsPlaying(false);
      stopRequestedRef.current = false;
      isSeekingRef.current = false;
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    try {
      if (Platform.OS === "web" && webAudioRef.current) {
        webAudioRef.current.volume = volume;
        return;
      }
      const activeSound = soundRef.current;
      if (activeSound) {
        const status = await activeSound.getStatusAsync();
        if (status.isLoaded) {
          await activeSound.setVolumeAsync(volume);
        }
      }
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  }, []);

  const seekTo = useCallback(async (positionMillis: number) => {
    if (stopRequestedRef.current) {
      return;
    }
    
    isSeekingRef.current = true;
    try {
      if (Platform.OS === "web" && webAudioRef.current) {
        const nextTime = positionMillis / 1000;
        // Avoid spamming currentTime with tiny changes.
        if (Math.abs((webAudioRef.current.currentTime ?? 0) - nextTime) > 0.06) {
          webAudioRef.current.currentTime = nextTime;
        }
        return;
      }
      const activeSound = soundRef.current;
      if (activeSound) {
        const status = await activeSound.getStatusAsync();
        if (status.isLoaded && !stopRequestedRef.current) {
          await activeSound.setStatusAsync({ positionMillis, shouldPlay: status.isPlaying });
        }
      }
    } catch (error: any) {
      if (!stopRequestedRef.current && !error?.message?.includes('Seeking interrupted')) {
        console.error("Error seeking:", error);
      }
    } finally {
      isSeekingRef.current = false;
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    try {
      if (Platform.OS === "web" && webAudioRef.current) {
        return webAudioRef.current.currentTime * 1000;
      }
      const activeSound = soundRef.current;
      if (activeSound) {
        const status = await activeSound.getStatusAsync();
        if (status.isLoaded) {
          return status.positionMillis || 0;
        }
      }
    } catch (error) {
      console.error("Error getting position:", error);
    }
    return 0;
  }, []);

  const getDuration = useCallback(async () => {
    try {
      if (Platform.OS === "web" && webAudioRef.current) {
        return (webAudioRef.current.duration || 0) * 1000;
      }
      const activeSound = soundRef.current;
      if (activeSound) {
        const status = await activeSound.getStatusAsync();
        if (status.isLoaded) {
          return status.durationMillis || 0;
        }
      }
    } catch (error) {
      console.error("Error getting duration:", error);
    }
    return 0;
  }, []);

  const getPlaybackRate = useCallback(async () => {
    try {
      if (Platform.OS === "web" && webAudioRef.current) {
        return webAudioRef.current.playbackRate || 1;
      }
      const activeSound = soundRef.current;
      if (activeSound) {
        const status = await activeSound.getStatusAsync();
        if (status.isLoaded && 'rate' in status) {
          return (status as any).rate || 1;
        }
      }
    } catch (error) {
      console.error("Error getting playback rate:", error);
    }
    return 1;
  }, []);

  return useMemo(
    () => ({
      preloadSound,
      playSound,
      pauseSound,
      stopSound,
      isPlaying,
      setVolume,
      seekTo,
      getCurrentPosition,
      getDuration,
      getPlaybackRate,
    }),
    [
      preloadSound,
      playSound,
      pauseSound,
      stopSound,
      isPlaying,
      setVolume,
      seekTo,
      getCurrentPosition,
      getDuration,
      getPlaybackRate,
    ]
  );
});