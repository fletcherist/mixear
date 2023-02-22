import React, { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleLog } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { GridColumns } from "@visx/grid";

import { localPoint } from "@visx/event";
import { minBy } from "./App";

export const frequenciesToGuess = [
  0, 20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000,
  2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500,
  9000, 9500, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000,
  19000, 20000,
];

export const Chart: React.FC<{
  frequencyNeedToGuess: number;
  onClick: (frequency: number) => void;
}> = ({ frequencyNeedToGuess, onClick }) => {
  // Define the graph dimensions and margins
  const width = 800;
  const height = 300;
  const margin = { top: 0, bottom: 25, left: 0, right: 0 };

  // Then we'll create some bounds
  const xMax = width - margin.left - margin.right - 10;
  const yMax = height - margin.top - margin.bottom;

  const [barX, setBarX] = useState<number>(-1);

  const xScale = useMemo(() => {
    return scaleLog<number>({
      range: [0, xMax],
      domain: [10, 20000],
    });
  }, [xMax]);

  return (
    <svg
      width={width}
      height={height}
      style={
        {
          // border: "1px solid black",
        }
      }
      onMouseMove={(event) => {
        const { x } = localPoint(event) || { x: 0 };
        setBarX(x);
      }}
      onMouseLeave={() => {
        setBarX(-1);
      }}
      onClick={(event) => {
        const { x } = localPoint(event) || { x: 0 };

        const pointsWithDistance = frequenciesToGuess.map((el) => {
          return { point: el, distance: Math.abs(x - Number(xScale(el))) };
        });

        const closestPoint = minBy(({ distance }) => {
          return distance;
        }, pointsWithDistance);

        if (closestPoint) {
          console.log("closestPoint", closestPoint);
          onClick(closestPoint?.point);
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
          //   numTicks={4}
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
            if (val >= 1000) {
              return `${val.valueOf() / 1000}k`;
            }
            return String(val.toString());
          }}
        />
        {/* <GridRows
            scale={yScale}
            width={xMax}
            stroke={colors.blackSecondary}
            numTicks={leftNumTicks}
          /> */}
        {frequencyNeedToGuess > 0 && (
          <Bar
            x={xScale(frequencyNeedToGuess)}
            width={2}
            height={height}
            stroke={"transparent"}
            fill={"green"}
          />
        )}
        {barX > 0 && <Bar x={barX} width={2} height={height} color={"#333"} />}
      </Group>
    </svg>
  );
};
