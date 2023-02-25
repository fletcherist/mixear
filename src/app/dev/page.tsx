"use client";

import React, { useState } from "react";

import { ToggleEqStory } from "@/components/Components";
import { Chart } from "@/components/Chart";
import { ChartState } from "@/components/Chart/Chart";

const Button: React.FC<
  React.PropsWithChildren<{
    onClick: () => void;
  }>
> = ({ children, onClick }) => {
  return (
    <button
      onClick={() => onClick()}
      type="button"
      className="py-2.5 px-5 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200"
    >
      {children}
    </button>
  );
};
const ChartStory = () => {
  const [state, setState] = useState<ChartState>({
    type: "initial",
  });

  return (
    <div>
      <Button
        onClick={() => {
          setState({ type: "initial" });
        }}
      >
        initial
      </Button>
      <Button
        onClick={() => {
          setState({ type: "loadingSamples" });
        }}
      >
        loading samples
      </Button>
      <Button
        onClick={() => {
          setState({ type: "selectingFrequency" });
        }}
      >
        selecting frequency
      </Button>
      <Button
        onClick={() => {
          setState({
            type: "frequencySelected",
            frequencyNeedToGuess: 500,
            selectedFrequency: 400,
          });
        }}
      >
        frequency selected
      </Button>
      <Chart
        state={state}
        height={200}
        width={600}
        onRequestChangeState={() => {
          //
        }}
      />
    </div>
  );
};

export default function Page() {
  return (
    <div>
      <ToggleEqStory />
      <ChartStory />
    </div>
  );
}
