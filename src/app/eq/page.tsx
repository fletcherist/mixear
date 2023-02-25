"use client";

import React from "react";
import { App } from "@/components/App/App";

export default function Page() {
  return (
    <div className="flex justify-center px-4">
      <div className="max-w-3xl w-full my-8">
        <div className="py-5">
          <h1 className="font-bold text-3xl text-gray-900 py-1">
            Find equalization frequency
          </h1>
          <p className="text-gray-600">
            Listen to the sample and guess which frequency is boosted
          </p>
        </div>
        <div className=" border border-gray-100 rounded-lg shadow-2xl shadow-slate-200">
          <div>
            <App width={768} height={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
