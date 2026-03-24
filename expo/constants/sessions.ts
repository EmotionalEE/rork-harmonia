import { EmotionalState, Session } from "@/types/session";

export const emotionalStates: EmotionalState[] = [
  {
    id: "anxious",
    label: "Anxious",
    gradient: ["#FF6B6B", "#C44569"],
    geometry: "anxious",
  },
  {
    id: "stressed",
    label: "Stressed",
    gradient: ["#F7971E", "#FFD200"],
    geometry: "stressed",
  },
  {
    id: "sad",
    label: "Sad",
    gradient: ["#667eea", "#764ba2"],
    geometry: "sad",
  },
  {
    id: "angry",
    label: "Angry",
    gradient: ["#f093fb", "#f5576c"],
    geometry: "angry",
  },
  {
    id: "calm",
    label: "Calm",
    gradient: ["#4facfe", "#00f2fe"],
    geometry: "calm",
  },
  {
    id: "happy",
    label: "Happy",
    gradient: ["#FFD700", "#fee140"],
    geometry: "happy",
  },
  {
    id: "inspired",
    label: "Inspired",
    gradient: ["#43e97b", "#38f9d7"],
    geometry: "inspired",
  },
  {
    id: "energized",
    label: "Energized",
    gradient: ["#30cfd0", "#330867"],
    geometry: "energized",
  },
];


export const sessions: Session[] = [
  {
    id: "welcome-intro",
    title: "Welcome / Intro Session",
    description: "Start here: a gentle introduction to Harmonia with a locked 12Hz binaural beat",
    duration: 5,
    frequency: "12",
    gradient: ["#22d3ee", "#14b8a6"],
    targetEmotions: ["happy"],
    audioUrl: "https://dl.dropboxusercontent.com/scl/fi/9rz7p1lrbn4rmh38i9f4u/Intro-song-session.m4a?rlkey=qb5qsvhfnpsfo9ylh1p1fd3st&raw=1",
  },
  {
    id: "dissolution-anxiousness",
    title: "Quiet the Alarm",
    description: "A grounding soundscape that helps the nervous system stand down from false urgency. Supports a natural return to calm without trying to fix or change how you feel.",
    duration: 5,
    frequency: "6",
    gradient: ["#FF6B6B", "#C44569"],
    targetEmotions: ["anxious"],
    audioUrl: "https://dl.dropboxusercontent.com/scl/fi/e9max0h2wo9kdbqmv8ywn/quiet_the_alarm_MUSICAL.wav?rlkey=vngdzykacdgl7fxbt1wf1uvnh&raw=1",
    audioSources: [
      {
        url: "https://dl.dropboxusercontent.com/scl/fi/e9max0h2wo9kdbqmv8ywn/quiet_the_alarm_MUSICAL.wav?rlkey=vngdzykacdgl7fxbt1wf1uvnh&raw=1",
        mime: "audio/wav",
        label: "Default",
      },
    ],
  },
  {
    id: "stress-release-flow",
    title: "Unwind the Mind",
    description: "Release accumulated stress and tension with 4hz theta waves",
    duration: 5,
    frequency: "4",
    gradient: ["#F7971E", "#FFD200"],
    targetEmotions: ["stressed"],
    audioUrl: "https://www.dropbox.com/scl/fi/kun5eqxx32y0yjdhxic8y/stress-release-flow.m4a?rlkey=gji6tz7k5x0a4pf0f97rlqn2y&st=4rtrw3db&raw=1",
  },
  {
    id: "lifting-from-sadness",
    title: "Lifting from Sadness",
    description: "Gently lift your spirit from sadness with 7hz theta waves",
    duration: 5,
    frequency: "7",
    gradient: ["#6E45E2", "#EABF87", "#6E45E2"],
    targetEmotions: ["sad"],
    audioUrl: "https://dl.dropboxusercontent.com/scl/fi/twhg5dyya6z47mmytia9n/lift-from-sadness.m4a?rlkey=js6t5o6vi6k62ysgl5ka9cvwg&st=jht8u6e6&raw=1",
    tempoBpm: 72,
  },
  {
    id: "alpha-waves",
    title: "Cooling the Edge",
    description: "10 Hz (alpha)\nA steady sound designed to support calm awareness and emotional regulation",
    duration: 5,
    frequency: "10",
    gradient: ["#f093fb", "#f5576c"],
    targetEmotions: ["angry"],
    audioUrl:
      "https://www.dropbox.com/scl/fi/ebc3zc6r7mb6wgpzngx2f/417hz-frequency-ambient-music-meditationcalmingzenspiritual-music-293573.mp3?rlkey=02nplpdtem9xpvmgqqoy815m9&raw=1",
    audioSources: [
      {
        url: "https://www.dropbox.com/scl/fi/ebc3zc6r7mb6wgpzngx2f/417hz-frequency-ambient-music-meditationcalmingzenspiritual-music-293573.mp3?rlkey=02nplpdtem9xpvmgqqoy815m9&raw=1",
        mime: "audio/mpeg",
        label: "Default",
      },
    ],
  },
  {
    id: "how-to-deepen-calm",
    title: "How to Deepen Calm",
    description: "Deepen your natural calm state with 8Hz alpha waves",
    duration: 5,
    frequency: "8",
    gradient: ["#3BA9F9", "#10E7F5"],
    targetEmotions: ["calm"],
    audioUrl: "https://www.dropbox.com/scl/fi/yfyfft88c7hjk52blrdbo/calm.m4a?rlkey=opgjbkvpm82uhhoh3xnkcdaab&st=jnbfosir&raw=1",
  },
  {
    id: "741hz-detox",
    title: "Turn up the light",
    description:
      "~10–14 Hz\n\nA bright, energizing soundscape designed to lift your mood and amplify what you’re already feeling. Turn Up the Light supports clarity, optimism, and forward momentum without overstimulation or crash. Perfect for afternoons when you want to feel more alive, open, and energized — no coffee required.",
    duration: 5,
    frequency: "10–14",
    gradient: ["#FFD700", "#fee140"],
    targetEmotions: ["happy"],
    audioUrl: "https://dl.dropboxusercontent.com/scl/fi/cd6omjnv2lxdpgk5egelr/Turn_Up_the_Light.now.wav?rlkey=pqkjwkj14zvuo8f38i9abjmdl&raw=1",
    audioSources: [
      {
        url: "https://dl.dropboxusercontent.com/scl/fi/cd6omjnv2lxdpgk5egelr/Turn_Up_the_Light.now.wav?rlkey=pqkjwkj14zvuo8f38i9abjmdl&raw=1",
        mime: "audio/wav",
        label: "Default",
      },
    ],
  },

  {
    id: "theta-healing",
    title: "Settle the System",
    description: "6 Hz (theta)\nA calming soundscape that helps settle the nervous system and soften internal noise, supporting a sense of safety and calm",
    duration: 5,
    frequency: "6",
    gradient: ["#f093fb", "#f5576c"],
    targetEmotions: ["anxious"],
    audioUrl: "https://www.dropbox.com/scl/fi/oihtlwsfke8gc6r55o59n/Settle-The-system.m4a?rlkey=nl1aaczxywdru01pc8c0azgxs&st=lcc00rgi&raw=1",
  },
  {
    id: "396hz-release",
    title: "Set the Field",
    description: "396 Hz\nA grounding sound designed to support steadiness, orientation, and balance. Ideal for mornings, intention-setting, or anytime you want to begin from a centered state.",
    duration: 5,
    frequency: "396",
    gradient: ["#a1c4fd", "#c2e9fb"],
    targetEmotions: ["stressed"],
    audioUrl: "https://www.dropbox.com/scl/fi/qi63twky8rmu0oqyxvwjt/Set-the-Field.m4a?rlkey=0u6f4yumsqf7qu9hmcxuv9h3f&st=fvsiuc2m&raw=1",
  },
  {
    id: "delta-sleep",
    title: "Held in Stillness",
    description: "2 Hz (delta)\nA slow, resting sound designed for moments that call for gentleness, pause, and deep stillness.",
    duration: 5,
    frequency: "2",
    gradient: ["#a8edea", "#fed6e3"],
    targetEmotions: ["sad"],
    audioUrl: "https://www.dropbox.com/scl/fi/0t7y1hm45dsmv1p2jzxuj/held_in_stillness_v3.wav?rlkey=31drmwnxlb00hmn0j50v8y687&st=wqjivev8&raw=1",
  },
  {
    id: "gamma-insight",
    title: "Acceptance Flow",
    description: "Flow into acceptance and understanding with 40Hz gamma waves",
    duration: 5,
    frequency: "40",
    gradient: ["#ffecd2", "#fcb69f"],
    targetEmotions: ["calm"],
    audioUrl:
      "https://www.dropbox.com/scl/fi/3ch5a5mj34wm7b7ivmyvs/Acceptance.m4a?rlkey=29ahqjxles1tdzphtm8773rxd&raw=1",
    audioSources: [
      {
        url: "https://www.dropbox.com/scl/fi/3ch5a5mj34wm7b7ivmyvs/Acceptance.m4a?rlkey=29ahqjxles1tdzphtm8773rxd&raw=1",
        mime: "audio/mp4",
        label: "Default",
      },
    ],
  },
  {
    id: "528hz-love",
    title: "Open to what is",
    description:
      "A gentle, expansive soundscape for welcoming whatever the day brings.\n\nOpen to What Is supports openness, optimism, and trust in the unfolding. Perfect for mornings or moments of transition when you want to feel receptive, steady, and ready — without pressure or expectation",
    duration: 5,
    frequency: "528",
    gradient: ["#ff9a9e", "#fecfef"],
    targetEmotions: ["happy"],
    audioUrl: "https://www.dropbox.com/scl/fi/1fwptryklytennie192vf/open-to-what-is.m4a?rlkey=noszhcbeoxgb6649zb9gb7wev&st=usvdarsw&raw=1",
  },
  {
    id: "how-to-spark-inspiration",
    title: "How to Spark Inspiration",
    description: "Ignite creative inspiration with 15Hz beta waves",
    duration: 12,
    frequency: "15",
    gradient: ["#43e97b", "#38f9d7"],
    targetEmotions: ["inspired"],
    audioUrl: "https://www.dropbox.com/scl/fi/4a099vrxfaceqfebrula1/how-to-spark-inspiration.m4a?rlkey=cet2l1ybe33896fj5zaxqmn7t&raw=1",
  },




  {
    id: "dynamic-energy-flow",
    title: "Dynamic Energy Flow",
    description: "Create dynamic energy flow with 18Hz beta waves",
    duration: 18,
    frequency: "18",
    gradient: ["#30cfd0", "#330867"],
    targetEmotions: ["energized"],
    audioUrl:
      "https://www.dropbox.com/scl/fi/ukpy7m229p8fbifyonirr/dynamic-energy-V5-2.m4a?rlkey=xqqkbtmbyvqpybe9qtqfu7tiy&st=1h2sixq5&raw=1",
    audioSources: [
      {
        url: "https://www.dropbox.com/scl/fi/ukpy7m229p8fbifyonirr/dynamic-energy-V5-2.m4a?rlkey=xqqkbtmbyvqpybe9qtqfu7tiy&st=1h2sixq5&raw=1",
        mime: "audio/mp4",
        label: "Default",
      },
    ],
  },
];