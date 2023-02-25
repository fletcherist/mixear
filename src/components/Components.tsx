"use client";

import React from "react";
import cx from "classnames";

export const ToggleEq: React.FC<{
  isActive?: boolean;
  disabled?: boolean;
  onChange: (isActive: boolean) => void;
}> = ({ isActive = false, onChange, disabled }) => {
  return (
    <div className="flex items-center">
      <span
        className={cx(
          "px-3 text-sm font-medium text-gray-600 cursor-pointer select-none",
          {
            "text-blue-600": !isActive,
            "text-gray-200": disabled,
            "cursor-default": disabled,
          }
        )}
        onClick={() => onChange(false)}
      >
        EQ Off
      </span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          value=""
          className="sr-only peer"
          checked={isActive}
          disabled={disabled}
          onChange={() => onChange(!isActive)}
        />
        <div
          className={cx(
            "w-24 h-12 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[8px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-10 after:w-10 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
          )}
        ></div>
      </label>
      <span
        className={cx(
          "px-3 text-sm font-medium text-gray-600 cursor-pointer select-none",
          {
            "text-blue-600": isActive,
            "text-gray-200": disabled,
            "cursor-default": disabled,
          }
        )}
        onClick={() => onChange(true)}
      >
        EQ On
      </span>
    </div>
  );
};

export const ToggleEqStory = () => {
  const [isActive, setIsActive] = React.useState(false);
  return (
    <div className="p-10">
      <div>
        <div className="inline-block">
          <ToggleEq
            isActive={isActive}
            onChange={(isActive) => setIsActive(isActive)}
          />
        </div>
      </div>
      <div>
        <div className="bg-purple-500 inline-block">
          <ToggleEq onChange={() => undefined} disabled />
        </div>
      </div>
      <div>
        <div className="bg-orange-500 inline-block">
          <ToggleEq onChange={() => undefined} />
        </div>
      </div>
    </div>
  );
};
