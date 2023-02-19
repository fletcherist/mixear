import React, { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { Bar, Line } from "@visx/shape";
import { scaleLinear, scaleBand } from "@visx/scale";
import { Axis, AxisBottom, AxisLeft } from "@visx/axis";

import { localPoint } from "@visx/event";
import { scaleLog } from "d3-scale";

// And then scale the graph by our data

const generateNumbers = () => {
  const data = [];
  for (let i = 1; i < 0; i++) {
    data.push(i);
  }
  return data;
};

export const Chart: React.FC<{}> = ({}) => {
  // Define the graph dimensions and margins
  const width = 600;
  const height = 300;
  const margin = { top: 0, bottom: 25, left: 50, right: 5 };

  // Then we'll create some bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const data = [0, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  //   const dataIndexes = data.map((_, index) => index);

  const [barX, setBarX] = useState<number>(-1);

  const xScale = useMemo(() => {
    return scaleBand<number>({
      range: [0, xMax],
      round: true,
      domain: data,
      padding: 0.4,
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
        // event
        const { x } = localPoint(event) || { x: 0 };
        setBarX(x);
      }}
      onMouseLeave={() => {
        setBarX(-1);
      }}
    >
      <Group>
        <AxisBottom
          scale={xScale}
          top={yMax}
          strokeWidth={2}
          numTicks={10}
          tickStroke="transparent"
          tickFormat={(val) => {
            if (val >= 1000) {
              return `${val / 1000}k`;
            }
            return String(val);
          }}
        />
        {barX > 0 && <Bar x={barX} width={2} height={height} color={"#333"} />}
      </Group>
    </svg>
  );
};
