import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

const FlipUnit = ({ value, label }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setIsFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const display = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16">
        {/* Card chính */}
        <div className={cn(
          "absolute inset-0 rounded-lg bg-white shadow-xl overflow-hidden",
          isFlipping ? "animate-flip-top" : ""
        )}>
          {/* Nửa trên */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white to-slate-100 flex items-center justify-center">
            <span className="text-red-600 font-black text-xl sm:text-2xl md:text-3xl leading-none select-none">
              {display}
            </span>
          </div>
          {/* Đường chia đôi */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-red-300/50 z-10" />
          {/* Nửa dưới */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-200 to-white flex items-center justify-center">
            <span className="text-red-600 font-black text-xl sm:text-2xl md:text-3xl leading-none select-none">
              {display}
            </span>
          </div>
        </div>
      </div>
      <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-red-200 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

const FlipCountdown = ({ remainingSeconds, endAt }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      let total;
      if (endAt) {
        const now = Date.now();
        const end = new Date(endAt).getTime();
        total = Math.max(0, Math.floor((end - now) / 1000));
      } else {
        total = remainingSeconds;
      }
      if (total == null || total <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(total / 86400);
      total %= 86400;
      const hours = Math.floor(total / 3600);
      total %= 3600;
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      setTimeLeft({ days, hours, minutes, seconds });
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [remainingSeconds, endAt]);

  const { days, hours, minutes, seconds } = timeLeft;

  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
    return (
      <div className="flex items-center gap-1 text-white font-black text-sm">
        <span>Đã kết thúc</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
      {days > 0 && (
        <>
          <FlipUnit value={days} label="Ngày" />
          <span className="text-white text-xl sm:text-2xl md:text-3xl font-black mb-4">:</span>
        </>
      )}
      <FlipUnit value={hours} label="Giờ" />
      <span className="text-white text-xl sm:text-2xl md:text-3xl font-black mb-4">:</span>
      <FlipUnit value={minutes} label="Phút" />
      <span className="text-white text-xl sm:text-2xl md:text-3xl font-black mb-4">:</span>
      <FlipUnit value={seconds} label="Giây" />
    </div>
  );
};

export default FlipCountdown;
