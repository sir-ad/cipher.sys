import { useState, useEffect } from 'react';

export const useNow = (updateIntervalMs: number = 60000): number => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, updateIntervalMs);

    return () => clearInterval(intervalId);
  }, [updateIntervalMs]);

  return now;
};
