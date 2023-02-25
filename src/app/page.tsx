import React from "react";
import Link from "next/link";

export default function App() {
  return (
    <div>
      <h1 className="font-medium text-3xl p-4 my-4 text-center tracking-wide leading-10">
        Improve mixing skills
        <br /> by playing games
      </h1>
      <div className="flex justify-center my-10">
        <Card />
      </div>
    </div>
  );
}

// tailwind card
const Card = () => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg">
      <img
        className="w-full"
        src="https://d29rinwu2hi5i3.cloudfront.net/article_media/6448c784-c7d3-4335-b954-982e4096aadc/headline-news-pro-q-2.jpg"
        alt="Fab Filter Pro Q3"
      />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">Equalization frequency</div>
        <p className="text-gray-700 text-base">
          Listen to the sample and guess which frequency is boosted
        </p>
      </div>
      <div className="px-6 py-4">
        <Link href="/eq">
          <button
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Play
          </button>
        </Link>
      </div>
    </div>
  );
};
