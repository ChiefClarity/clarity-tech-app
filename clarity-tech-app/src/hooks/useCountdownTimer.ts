import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseCountdownTimerProps {
  initialMinutes: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

interface UseCountdownTimerReturn {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  display: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  isRunning: boolean;
}

export const useCountdownTimer = ({
  initialMinutes,
  onExpire,
  autoStart = false,
}: UseCountdownTimerProps): UseCountdownTimerReturn => {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);

  // Update the ref when onExpire changes
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Calculate minutes and seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Format display string
  const display = useMemo(() => {
    const mins = minutes.toString().padStart(2, '0');
    const secs = seconds.toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [minutes, seconds]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!isExpired && totalSeconds > 0) {
      setIsRunning(true);
    }
  }, [isExpired, totalSeconds]);

  const reset = useCallback(() => {
    stop();
    setTotalSeconds(initialMinutes * 60);
    setIsExpired(false);
  }, [initialMinutes, stop]);

  // Handle timer countdown
  useEffect(() => {
    if (isRunning && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            setIsRunning(false);
            setIsExpired(true);
            
            // Call onExpire callback
            if (onExpireRef.current) {
              onExpireRef.current();
            }
            
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, totalSeconds]);

  return {
    minutes,
    seconds,
    isExpired,
    display,
    start,
    stop,
    reset,
    isRunning,
  };
};