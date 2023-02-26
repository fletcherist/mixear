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

export const frequenciesToGuess = [
  0, 20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000,
  2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500,
  9000, 9500, 10000, 11000, 12000, 13000, 14000, 15000, 16000,
  // 17000,
  // 18000,
  // 19000, 20000,
];

export const getFrequencyConfidenceInterval = (frequency: number): number => {
  if (frequency < 1000) {
    return 200;
  } else if (frequency < 2000) {
    return 500;
  } else if (frequency < 5000) {
    return 1000;
  } else if (frequency < 10000) {
    return 2000;
  } else if (frequency < 20000) {
    return 5000;
  }

  const defaultConfidenceInterval = 500;
  return defaultConfidenceInterval;
};
