import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

const CountdownTimer = ({ targetDate, remainingSeconds, className }) => {
  // Initialize with remainingSeconds if available, otherwise 0
  const getInitialTime = () => {
    if (remainingSeconds != null && remainingSeconds > 0) {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      return { hours, minutes, seconds };
    }
    return { hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTime);
  const hasRemaining = remainingSeconds != null && remainingSeconds > 0;
  const intervalRef = useRef(null);

  useEffect(() => {
    // Ưu tiên remainingSeconds từ backend, tính toán offline
    if (hasRemaining) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          let { hours, minutes, seconds } = prev;
          seconds--;
          if (seconds < 0) {
            seconds = 59;
            minutes--;
            if (minutes < 0) {
              minutes = 59;
              hours--;
              if (hours < 0) {
                clearInterval(intervalRef.current);
                return { hours: 0, minutes: 0, seconds: 0 };
              }
            }
          }
          return { hours, minutes, seconds };
        });
      }, 1000);
    } else if (targetDate) {
      // Fallback: dùng targetDate (ISO date string)
      const calculateTimeLeft = () => {
        const difference = new Date(targetDate) - new Date();
        if (difference > 0) {
          setTimeLeft({
            hours: Math.floor((difference / (1000 * 60 * 60))),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
          });
        } else {
          clearInterval(intervalRef.current);
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
      };
      calculateTimeLeft();
      intervalRef.current = setInterval(calculateTimeLeft, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetDate, remainingSeconds, hasRemaining]);

  const format = (num) => num.toString().padStart(2, '0');

  const TimeUnit = ({ value, label }) => (
    <div className="flex items-center">
      <div className="bg-slate-900 text-white w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-lg">
        {format(value)}
      </div>
      {label !== 'S' && <span className="mx-1 md:mx-2 font-black text-white">:</span>}
    </div>
  );

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TimeUnit value={timeLeft.hours} label="H" />
      <TimeUnit value={timeLeft.minutes} label="M" />
      <TimeUnit value={timeLeft.seconds} label="S" />
    </div>
  );
};

export default CountdownTimer;
