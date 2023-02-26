import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Chart } from "../Chart";
import { frequenciesToGuess } from "../../utils";
import { ToggleEq } from "../Components";
import { ChartState } from "../Chart/Chart";

export const App: React.FC<{
  width: number;
  height: number;
}> = ({ width, height }) => {
  return (
    <AudioContextProvider>
      <PlayerStoreProvider>
        <Player width={width} height={height} />
      </PlayerStoreProvider>
    </AudioContextProvider>
  );
};

const sampleInstasamka =
  "https://saemple.storage.googleapis.com/samples/364658335828877324/884338350415985227.wav";
const samples = [
  "https://saemple.storage.googleapis.com/samples/710542751189738547/028389564039802015.wav",
  "https://saemple.storage.googleapis.com/samples/456197260834025431/588304601958060462.wav",
  sampleInstasamka,
  "https://saemple.storage.googleapis.com/samples/236009982688876348/488799548479455593.wav",
  "https://saemple.storage.googleapis.com/samples/2839775813052493327/1764557945516372387.wav",

  "https://saemple.storage.googleapis.com/samples/612767769831785512/928590085350151463.wav", // slowdive - when the sun hits
  "https://saemple.storage.googleapis.com/samples/612767769831785512/086081468412168300.wav", // slowdive - when the sun hits

  "https://saemple.storage.googleapis.com/samples/263335366049086998/190397988066996402.wav", // хадн дадн Звёзды на плечах
  "https://saemple.storage.googleapis.com/samples/263335366049086998/566407676913142410.wav", // хадн дадн Звёзды на плечах

  "https://saemple.storage.googleapis.com/samples/719929847000902526/730623583282046784.wav", // david bowie - blackstar
  "https://saemple.storage.googleapis.com/samples/719929847000902526/899176951140820102.wav", // david bowie - blackstar

  "https://saemple.storage.googleapis.com/samples/799158622811995158/368535194317543561.wav", // molchat doma
  "https://saemple.storage.googleapis.com/samples/799158622811995158/630617968201966402.wav",
  "https://saemple.storage.googleapis.com/samples/799158622811995158/993487251695383202.wav",
  "https://saemple.storage.googleapis.com/samples/799158622811995158/084871179120338707.wav",

  "https://saemple.storage.googleapis.com/samples/478066222647321484/249584092551980229.wav", // motorama to the south
  "https://saemple.storage.googleapis.com/samples/478066222647321484/925765934229899042.wav",
  "https://saemple.storage.googleapis.com/samples/478066222647321484/061537930000358873.wav",
];

const getRandomSample = () => {
  return samples[Math.floor(Math.random() * samples.length)];
};

const Player: React.FC<{
  width: number;
  height: number;
}> = ({ width, height }) => {
  const player = usePlayer();

  const [sample, setSample] = useState<string>(getRandomSample());
  const [frequency, setFrequency] = useState<number>(0);
  const [eqEnabled, setEqEnabled] = useState<boolean>(true);
  const [chartState, setChartState] = useState<ChartState>({ type: "initial" });

  const gainOn = 0.9;
  const enableEq = () => {
    player.api.setTrack1Gain(0);
    player.api.setTrack2Gain(gainOn);
    setEqEnabled(true);
  };
  const disableEq = () => {
    player.api.setTrack1Gain(gainOn);
    player.api.setTrack2Gain(0);
    setEqEnabled(false);
  };
  const toggleEq = useCallback(
    (isActive: boolean) => {
      if (isActive) {
        player.api.setTrack1Gain(0);
        player.api.setTrack2Gain(gainOn);
      } else {
        player.api.setTrack1Gain(gainOn);
        player.api.setTrack2Gain(0);
      }
      setEqEnabled(isActive);
    },
    [player.api]
  );
  // toogle eq using space key
  useEffect(() => {
    const handleKeypress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();

        if (chartState.type === "selectingFrequency") {
          toggleEq(!eqEnabled);
        } else if (chartState.type === "frequencySelected") {
          // continue with next sample
          const asyncPrepareNewGuess = async () => {
            setChartState({ type: "loadingSamples" });
            await prepareNewGuess();
            setChartState({ type: "selectingFrequency" });
          };
          asyncPrepareNewGuess();
        }
      }
    };
    window.addEventListener("keypress", handleKeypress);

    return () => {
      window.removeEventListener("keypress", handleKeypress);
    };
  }, [eqEnabled, toggleEq, chartState.type]);

  const prepareNewGuess = async () => {
    // peak random frequency from list and boost it
    const randomFrequency =
      frequenciesToGuess[Math.floor(Math.random() * frequenciesToGuess.length)];

    // const sampleUrl =
    //   "https://saemple.com/storage/samples/236009982688876348/488799548479455593.wav";
    // const sampleUrl =
    //   "https://saemple.storage.googleapis.com/samples/236009982688876348/488799548479455593.wav";
    setSample(getRandomSample());

    await Promise.all([
      player.api.prepareTrack1(sample, {
        type: "eq",
        frequency: 0,
        gain: 0,
        q: 1,
      }),
      player.api.prepareTrack2(sample, {
        type: "eq",
        frequency: randomFrequency,
        gain: 10,
        q: 0.9,
      }),
    ]);

    setFrequency(randomFrequency);
    enableEq();

    // enable only wet track
    player.api.setTrack1Gain(0);
    player.api.setTrack2Gain(1);

    player.api.play();
  };

  const renderStatePlaySound = () => {
    const isToggleDisabled = chartState.type !== "selectingFrequency";
    return (
      <div>
        <div className="flex justify-center py-4">
          <ToggleEq
            disabled={isToggleDisabled}
            isActive={eqEnabled}
            onChange={(isActive) => {
              if (isToggleDisabled) {
                return;
              }
              toggleEq(isActive);
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <Chart
        width={width}
        height={height}
        state={chartState}
        onRequestChangeState={async (stateChange) => {
          if (stateChange.type === "clickStart") {
            setChartState({ type: "loadingSamples" });
            await prepareNewGuess();
            setChartState({ type: "selectingFrequency" });
          }
          if (stateChange.type === "selectFrequency") {
            player.api.stop();
            setChartState({
              type: "frequencySelected",
              frequencyNeedToGuess: frequency,
              selectedFrequency: stateChange.frequency,
            });
          } else if (stateChange.type === "clickContinue") {
            setChartState({ type: "loadingSamples" });
            await prepareNewGuess();
            setChartState({ type: "selectingFrequency" });
          }
        }}
      />
      <div>{renderStatePlaySound()}</div>
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
          eq.Q.value = effect.q;
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
  q: number;
}

type AudioEffect = AudioEffectEq;

export default App;
