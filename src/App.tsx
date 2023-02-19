import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";

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

const Player = () => {
  const player = usePlayer();
  const [sample, setSample] = useState<string>(
    samples[Math.floor(Math.random() * samples.length)]
  );
  const [playedTrack, setPlayedTrack] = useState<"dry" | "wet">("wet");
  const [state, setState] = useState<
    "initial" | "loadingSamples" | "playSound"
  >("initial");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const renderState = () => {
    if (state === "initial") {
      return (
        <button
          onClick={async () => {
            setState("loadingSamples");

            await Promise.all([
              player.api.prepareTrack1(
                "https://saemple.com/storage/samples/236009982688876348/488799548479455593.wav",
                {
                  type: "eq",
                  frequency: 0,
                  gain: 0,
                }
              ),
              player.api.prepareTrack2(
                "https://saemple.com/storage/samples/236009982688876348/488799548479455593.wav", //
                {
                  type: "eq",
                  frequency: 5000,
                  gain: 10,
                }
              ),
            ]);

            // enable only wet track
            player.api.setTrack1Gain(0);
            player.api.setTrack2Gain(1);

            setState("playSound");

            player.api.play();
            setIsPlaying(true);
          }}
        >
          start
        </button>
      );
    } else if (state === "loadingSamples") {
      return <div>loading...</div>;
    } else if (state === "playSound") {
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
          <button
            onClick={() => {
              player.api.setTrack1Gain(1);
              player.api.setTrack2Gain(0);
            }}
          >
            play 1
          </button>
          <button
            onClick={() => {
              player.api.setTrack1Gain(0);
              player.api.setTrack2Gain(1);
            }}
          >
            play 2
          </button>
        </div>
      );
    }
  };

  return <div>{renderState()}</div>;
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
  // track1buffer: AudioBuffer | null;
  // track1bufferSourceNode: AudioBufferSourceNode | null;
  // track1GainNode: GainNode | null;
  // track2buffer: AudioBuffer | null;
  // track2bufferSourceNode: AudioBufferSourceNode | null;
  // track2GainNode: GainNode | null;

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

      const mixerNode = audioContext.createGain();
      mixerNode.gain.value = 1;

      const track1GainNode = audioContext.createGain();
      track1GainNode.gain.value = 1;

      const track2GainNode = audioContext.createGain();
      track2GainNode.gain.value = 1;

      state.track1.gainNode = track1GainNode;
      state.track2.gainNode = track2GainNode;
      state.mixerNode = mixerNode;

      track1GainNode.connect(mixerNode);
      track2GainNode.connect(mixerNode);
      mixerNode.connect(audioContext.destination);
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
      state.isPlaying = false;
    }
    if (state.track2.bufferSourceNode) {
      state.track2.bufferSourceNode.stop();
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
