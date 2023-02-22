import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";

import { Chart, frequenciesToGuess } from "./Chart";

function App() {
  return (
    <AudioContextProvider>
      <PlayerStoreProvider>
        <Player />
      </PlayerStoreProvider>
    </AudioContextProvider>
  );
}

const sampleInstasamka =
  "https://saemple.com/storage/samples/364658335828877324/884338350415985227.wav";
const samples = [
  "https://saemple.com/storage/samples/710542751189738547/028389564039802015.wav",
  "https://saemple.com/storage/samples/456197260834025431/588304601958060462.wav",
  sampleInstasamka,
  "https://saemple.com/storage/samples/236009982688876348/488799548479455593.wav",
  "https://saemple.com/storage/samples/2839775813052493327/1764557945516372387.wav",
];

const getRandomSample = () => {
  return samples[Math.floor(Math.random() * samples.length)];
};

const Player = () => {
  const player = usePlayer();

  const [sample, setSample] = useState<string>(getRandomSample());
  const [state, setState] = useState<
    "initial" | "loadingSamples" | "playSound" | "showResult"
  >("initial");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<number>(0);

  const prepareNewGuess = async () => {
    setState("loadingSamples");

    // peak random frequency from list and boost it
    const randomFrequency =
      frequenciesToGuess[Math.floor(Math.random() * frequenciesToGuess.length)];

    const sampleUrl =
      "https://saemple.com/storage/samples/236009982688876348/488799548479455593.wav";
    await Promise.all([
      player.api.prepareTrack1(sampleUrl, {
        type: "eq",
        frequency: 0,
        gain: 0,
      }),
      player.api.prepareTrack2(sampleUrl, {
        type: "eq",
        frequency: randomFrequency,
        gain: 10,
      }),
    ]);

    setFrequency(randomFrequency);

    // enable only wet track
    player.api.setTrack1Gain(0);
    player.api.setTrack2Gain(1);

    setState("playSound");

    player.api.play();
    setIsPlaying(true);
  };

  const renderStateInitial = () => {
    return (
      <button
        onClick={async () => {
          await prepareNewGuess();
        }}
      >
        start
      </button>
    );
  };

  const renderStatePlaySound = () => {
    return (
      <div>
        <button
          onClick={() => {
            if (isPlaying) {
              player.api.stop();
              setIsPlaying(false);
            } else {
              player.api.play();
              setIsPlaying(true);
            }
          }}
        >
          {isPlaying ? "stop" : "play"}
        </button>

        <div>
          <button
            onClick={() => {
              player.api.setTrack1Gain(1);
              player.api.setTrack2Gain(0);
            }}
          >
            eq off
          </button>
          <button
            onClick={() => {
              player.api.setTrack1Gain(0);
              player.api.setTrack2Gain(1);
            }}
          >
            eq on
          </button>
        </div>
      </div>
    );
  };

  const renderStateLoadingSamples = () => {
    return <div>loading...</div>;
  };

  const renderState = () => {
    if (state === "initial") {
      return renderStateInitial();
    } else if (state === "loadingSamples") {
      return renderStateLoadingSamples();
    } else if (state === "playSound") {
      return renderStatePlaySound();
    }
  };

  return (
    <div style={{ padding: 50 }}>
      <Chart
        frequencyNeedToGuess={state === "showResult" ? frequency : 0}
        onClick={async (guessedFrequency) => {
          if (state === "playSound") {
            player.api.stop();
            setIsPlaying(false);
            setState("showResult");
          } else if (state === "showResult") {
            await prepareNewGuess();
          }
        }}
      />
      <div>{renderState()}</div>
    </div>
  );
};

const createAudioContext = (): AudioContext => {
  window.AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();

  return audioContext;
};
const AudioContextContext = React.createContext<AudioContext | undefined>(
  undefined
);
export const AudioContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const refAudioContext = useRef<AudioContext>();
  if (!refAudioContext.current && typeof window !== "undefined") {
    refAudioContext.current = createAudioContext();
  }

  return (
    <AudioContextContext.Provider value={refAudioContext.current}>
      {children}
    </AudioContextContext.Provider>
  );
};
export const useAudioContext = (): AudioContext | undefined => {
  const audioContext = useContext(AudioContextContext);
  // if (!audioContext) {
  //   throw new Error('AudioContext is not initialized');
  // }

  return audioContext; // audio context is always defined, but may be in suspended state
};

interface Track {
  buffer: AudioBuffer | null;
  bufferSourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  isPlaying: boolean;
}

export interface PlayerState {
  track1: Track;
  track2: Track;

  mixerNode: GainNode | null;
  isPlaying: boolean;
}

interface PlayerApi {
  prepareTrack1: (url: string, effect: AudioEffect) => Promise<void>;
  prepareTrack2: (url: string, effect: AudioEffect) => Promise<void>;
  play: () => Promise<void>;

  setTrack1Gain: (gain: number) => void;
  setTrack2Gain: (gain: number) => void;

  stop: () => void;
  isPlaying: () => boolean;
}
interface PlayerStore {
  state: PlayerState;
  // update: (partial: Partial<State>) => void;
  api: PlayerApi;
}

const defaultPlayerState: PlayerState = {
  track1: {
    buffer: null,
    bufferSourceNode: null,
    gainNode: null,
    isPlaying: false,
  },
  track2: {
    buffer: null,
    bufferSourceNode: null,
    gainNode: null,
    isPlaying: false,
  },
  mixerNode: null,
  isPlaying: false,
};

const PlayerStoreContext = React.createContext<PlayerStore | undefined>(
  undefined
);
export const PlayerStoreProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const audioContext = useAudioContext();
  const refState = useRef<PlayerState>(defaultPlayerState);
  const refIsInited = useRef<boolean>(false);

  useEffect(() => {
    // check already inited
    if (refIsInited.current) {
      return;
    }
    refIsInited.current = true;

    if (audioContext) {
      const state = refState.current;

      state.mixerNode = audioContext.createGain();
      state.mixerNode.gain.value = 1;

      state.track1.gainNode = audioContext.createGain();
      state.track1.gainNode.gain.value = 1;

      state.track2.gainNode = audioContext.createGain();
      state.track2.gainNode.gain.value = 1;

      state.track1.gainNode.connect(state.mixerNode);
      state.track2.gainNode.connect(state.mixerNode);
      state.mixerNode.connect(audioContext.destination);
    }
  }, [audioContext]);

  const isPlaying = (): boolean => {
    const state = refState.current;

    return state.isPlaying;
  };
  const stop = () => {
    const state = refState.current;
    if (state.track1.bufferSourceNode) {
      state.track1.bufferSourceNode.stop();
      state.track1.isPlaying = false;
    }
    if (state.track2.bufferSourceNode) {
      state.track2.bufferSourceNode.stop();
      state.track2.isPlaying = false;
    }
  };

  const createPlayerApi = (): PlayerApi => {
    if (typeof window === "undefined") {
      return {
        play: async () => {},
        stop: async () => {},
        isPlaying: () => false,

        prepareTrack1: async () => {},
        prepareTrack2: async () => {},

        setTrack1Gain: () => undefined,
        setTrack2Gain: () => undefined,
      };
    }

    const playerApi: PlayerApi = {
      prepareTrack1: async (url: string, effect: AudioEffect) => {
        if (!audioContext) {
          return;
        }

        const state = refState.current;

        // Load some audio (CORS need to be allowed or we won't be able to decode the data)
        const resp = await fetch(url, { mode: "cors" });
        const buf = await resp.arrayBuffer();

        const audioBuf = await audioContext.decodeAudioData(buf);
        state.track1.buffer = audioBuf;

        const eq = audioContext.createBiquadFilter();
        if (effect.type === "eq") {
          eq.type = "peaking";
          eq.frequency.value = effect.frequency;
          eq.gain.value = effect.gain;
        }

        if (state.track1.gainNode) {
          eq.connect(state.track1.gainNode);
        }
        if (state.track1.gainNode) {
          state.track1.bufferSourceNode = audioContext.createBufferSource(); // create audio source
          state.track1.bufferSourceNode.buffer = state.track1.buffer; // use decoded buffer
          state.track1.bufferSourceNode.connect(eq); // create output
          state.track1.bufferSourceNode.loop = true; // takes care of perfect looping
        }
      },
      prepareTrack2: async (url: string, effect: AudioEffect) => {
        if (!audioContext) {
          return;
        }

        const state = refState.current;

        // Load some audio (CORS need to be allowed or we won't be able to decode the data)
        const resp = await fetch(url, { mode: "cors" });
        const buf = await resp.arrayBuffer();

        const audioBuf = await audioContext.decodeAudioData(buf);
        state.track2.buffer = audioBuf;

        const eq = audioContext.createBiquadFilter();
        if (effect.type === "eq") {
          eq.type = "peaking";
          eq.frequency.value = effect.frequency;
          eq.gain.value = effect.gain;
        }

        if (state.track2.gainNode) {
          eq.connect(state.track2.gainNode);
        }
        if (state.track2.gainNode) {
          state.track2.bufferSourceNode = audioContext.createBufferSource(); // create audio source
          state.track2.bufferSourceNode.buffer = state.track2.buffer; // use decoded buffer
          state.track2.bufferSourceNode.connect(eq); // create output
          state.track2.bufferSourceNode.loop = true; // takes care of perfect looping
        }
      },
      setTrack1Gain: (gain: number) => {
        const state = refState.current;
        if (state.track1.gainNode) {
          state.track1.gainNode.gain.value = gain;
        }
      },
      setTrack2Gain: (gain: number) => {
        const state = refState.current;
        if (state.track2.gainNode) {
          state.track2.gainNode.gain.value = gain;
        }
      },
      play: async () => {
        if (!audioContext) {
          return;
        }

        const state = refState.current;

        // if (state.track1bufferSourceNode) {
        //   state.track1bufferSourceNode.stop();
        // }
        // if (state.track2bufferSourceNode) {
        //   state.track2bufferSourceNode.stop();
        // }

        if (state.track1.bufferSourceNode && state.track2.bufferSourceNode) {
          state.track1.bufferSourceNode.start(); // play...
          state.track2.bufferSourceNode.start(); // play...

          state.isPlaying = true;
        }
      },
      stop: stop,
      isPlaying: isPlaying,
    };

    return playerApi;
  };

  const playerApi = createPlayerApi();

  return (
    <PlayerStoreContext.Provider
      value={{
        state: refState.current,
        // update:,
        api: playerApi,
      }}
    >
      {children}
    </PlayerStoreContext.Provider>
  );
};

export const usePlayer = (): PlayerStore => {
  const context = useContext(PlayerStoreContext);

  return context as PlayerStore; // store is defined anyway
};

interface AudioEffectEq {
  type: "eq";
  frequency: number;
  gain: number;
}

type AudioEffect = AudioEffectEq;

export default App;

// minBy from ramda is not suitable here
export function minBy<T>(
  select: (obj: T) => string | number,
  list: T[]
): T | undefined {
  if (!list || list.length === 0) {
    return undefined;
  }
  return list.reduce((a, b) => {
    return select(a) < select(b) ? a : b;
  });
}

// returns range of values e.g [start, start + 1, ..., end]
export const range = (start: number, end: number): number[] => {
  const res = [];
  for (let i = start; i <= end; i = i + 1) {
    res.push(i);
  }
  return res;
};

export function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), ms);
  });
}
