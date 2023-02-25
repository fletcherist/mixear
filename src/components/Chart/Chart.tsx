import React, { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleLog } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { GridColumns } from "@visx/grid";

import { localPoint } from "@visx/event";
import {
  minBy,
  frequenciesToGuess,
  getFrequencyConfidenceInterval,
} from "../../utils";

interface ChartStateFrequencySelected {
  type: "frequencySelected";
  selectedFrequency: number;
  frequencyNeedToGuess: number;
}

interface ChartStateSelectingFrequency {
  type: "selectingFrequency";
}

interface ChartStateInitial {
  type: "initial";
}

interface ChartStateLoadingSamples {
  type: "loadingSamples";
}

export type ChartState =
  | ChartStateInitial
  | ChartStateLoadingSamples
  | ChartStateSelectingFrequency
  | ChartStateFrequencySelected;

export type ChartChangeState =
  | { type: "clickStart" }
  | { type: "clickContinue" }
  | { type: "selectFrequency"; frequency: number };

const colorBlue = "rgb(37 99 235)";
const colorGreen = "rgb(74 222 128)";

const formatFrequency = (frequency: number): string => {
  if (frequency >= 1000) {
    return `${frequency / 1000}k`;
  }
  return String(frequency.toString());
};

const getAccuracy = (
  predictedFrequency: number,
  resultFrequency: number
): number => {
  const predictedFrequencyLog = Math.log(predictedFrequency);
  const resultFrequencyLog = Math.log(resultFrequency);

  const errorRate =
    (Math.abs(predictedFrequencyLog - resultFrequencyLog) /
      resultFrequencyLog) *
    100;
  return Math.round(100 - errorRate);
};

const Button: React.FC<
  React.PropsWithChildren<{
    isLoading?: boolean;
    onClick: () => void;
  }>
> = ({ children, isLoading, onClick }) => {
  const renderSpinner = () => {
    return (
      <div role="status" className="flex justify-center">
        <svg
          aria-hidden="true"
          className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  };
  return (
    <button
      onClick={() => onClick()}
      type="button"
      className="py-2 px-5 w-24 text-xs font-medium text-gray-900 focus:outline-none bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200"
    >
      {isLoading ? renderSpinner() : children}
    </button>
  );
};

const Chart: React.FC<{
  width: number;
  height: number;
  state: ChartState;
  onRequestChangeState: (state: ChartChangeState) => void;
}> = ({ width, height, state, onRequestChangeState }) => {
  // Define the graph dimensions and margins
  const margin = { top: 0, bottom: 25, left: 0, right: 0 };

  // Then we'll create some bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const [barX, setBarX] = useState<number>(-1);
  // const [confidenceInterval, setConfidenceInterval] = useState<number>(0);

  const xScale = useMemo(() => {
    return scaleLog<number>({
      range: [0, xMax],
      domain: [10, 25000],
    });
  }, [xMax]);

  const getFrequencyByX = (x: number): number => {
    const pointsWithDistance = frequenciesToGuess.map((el) => {
      return { point: el, distance: Math.abs(x - Number(xScale(el))) };
    });

    const closestPoint = minBy(({ distance }) => {
      return distance;
    }, pointsWithDistance);

    return closestPoint?.point || 0;
  };

  const getConfidenceIntervalForFrequency = (frequency: number): number => {
    const confidenceInterval = getFrequencyConfidenceInterval(frequency);
    const x1 = xScale(frequency - confidenceInterval);
    const x2 = xScale(frequency + confidenceInterval);
    return x2 - x1;
  };

  const renderFrequencySelectedPopover = () => {
    if (state.type === "frequencySelected") {
      return (
        <div
          style={{
            position: "absolute",
            left: xScale(state.selectedFrequency) + 10,
            top: yMax / 2 - 40,
          }}
          id="popover-right"
          role="tooltip"
          className="absolute flex items-center max-w-xs p-3 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow top-5 left-5  space-x"
        >
          <div className="text-xs font-normal">
            <p>
              Selected frequency:{" "}
              <span className="text-blue-500">
                {formatFrequency(state.selectedFrequency)}hz
              </span>
            </p>
            <p>
              Boosted frequency:{" "}
              <span className="text-green-500">
                {formatFrequency(state.frequencyNeedToGuess)}hz
              </span>
            </p>
            <p>
              Accuracy:{" "}
              {getAccuracy(state.selectedFrequency, state.frequencyNeedToGuess)}
              %
            </p>
            <button
              type="button"
              className="py-1.5 px-3 mt-2 text-xs font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200"
              onClick={() => {
                onRequestChangeState({ type: "clickContinue" });
              }}
            >
              Continue
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const shouldRenderStartButton =
    state.type === "initial" || state.type == "loadingSamples";
  return (
    <div className="relative">
      {shouldRenderStartButton && (
        <div className="absolute w-full h-full">
          <div className="flex justify-center items-center h-full">
            <Button
              onClick={() => {
                onRequestChangeState({ type: "clickStart" });
              }}
              isLoading={state.type == "loadingSamples"}
            >
              Start
            </Button>
          </div>
        </div>
      )}
      {state.type == "frequencySelected" && renderFrequencySelectedPopover()}
      <svg
        width={width}
        height={height}
        onMouseMove={(event) => {
          const { x } = localPoint(event) || { x: 0 };
          const frequency = getFrequencyByX(x);
          const confidenceInterval =
            getConfidenceIntervalForFrequency(frequency);

          // setConfidenceInterval(confidenceInterval);
          setBarX(x);
        }}
        onMouseLeave={() => {
          setBarX(-1);
        }}
        onClick={(event) => {
          if (state.type === "selectingFrequency") {
            const { x } = localPoint(event) || { x: 0 };
            const closestPoint = getFrequencyByX(x);
            onRequestChangeState({
              type: "selectFrequency",
              frequency: closestPoint,
            });
          }
        }}
      >
        <Group>
          <GridColumns
            scale={xScale}
            height={yMax}
            stroke={"#dbdbdb"}
            strokeDasharray="0"
            tickValues={[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]}
          />
          <AxisBottom
            scale={xScale}
            top={yMax}
            strokeWidth={2}
            numTicks={10}
            stroke={"#dbdbdb"}
            tickStroke="transparent"
            tickValues={[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]}
            tickFormat={(val) => {
              return formatFrequency(Number(val));
            }}
            tickClassName="uppercase"
          />
          {/* <GridRows
            scale={yScale}
            width={xMax}
            stroke={colors.blackSecondary}
            numTicks={leftNumTicks}
          /> */}
          {state.type === "selectingFrequency" && barX > 0 && (
            <Group>
              {/* <Bar
              x={barX - confidenceInterval / 2}
              width={confidenceInterval}
              height={yMax}
              fill={"gray"}
            /> */}
              <Bar x={barX} width={2} height={yMax} fill={colorBlue} />
            </Group>
          )}
          {state.type === "frequencySelected" && (
            <>
              <Bar
                x={xScale(state.frequencyNeedToGuess)}
                width={2}
                height={yMax}
                stroke={"transparent"}
                fill={colorGreen}
              />
              <Bar
                x={xScale(state.selectedFrequency)}
                width={2}
                height={yMax}
                stroke={"transparent"}
                fill={colorBlue}
              />
            </>
          )}
        </Group>
      </svg>
    </div>
  );
};

export default Chart;
