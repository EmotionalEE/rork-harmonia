export interface EmotionalState {
  id: string;
  label: string;
  gradient: string[];
  geometry: "anxious" | "stressed" | "sad" | "angry" | "calm" | "happy" | "inspired" | "energized";
}

export interface SessionAudioSource {
  url: string;
  mime?: string;
  label?: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  frequency: string; // in Hz
  gradient: string[];
  targetEmotions: string[];
  audioUrl: string;
  audioSources?: SessionAudioSource[];
  tempoBpm?: number;
}

export interface SessionProgress {
  sessionId: string;
  completedAt: Date;
  duration: number;
}

export interface ReflectionEntry {
  id: string;
  sessionId: string;
  sessionName: string;
  completedAt: string;
  sliderValue: number;
  journalText?: string | null;
  insight: string;
  microLabel?: string | null;
}
