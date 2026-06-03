import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { parseLocalDateTime } from '../../utils/flashSaleTime';

const FlipDigit = ({ value, label, glow }) => {
  const display = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn(
        "relative rounded-xl overflow-hidden",
        glow
          ? "bg-gradient-to-b from-white to-slate-100 shadow-[0_2px_12px_rgba(253,224,71,0.5),0_0_20px_rgba(253,224,71,0.2)]"
          : "bg-gradient-to-b from-white to-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
      )}>
        {/* Number container */}
        <div className="relative h-8 sm:h-9 md:h-11 px-2 sm:px-2.5 md:px-3 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/40 to-transparent" />
          <span
            className={cn(
              "font-black text-lg sm:text-xl md:text-2xl leading-none select-none transition-all text-red-600"
            )}
          >
            {display}
          </span>
        </div>
      </div>

      <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-white/60 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

const Colon = ({ glow }) => (
  <span className={cn(
    "font-black text-white/70 mb-3 select-none animate-colon-blink",
    glow ? "drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" : ""
  )}>
    :
  </span>
);

const CountdownTimer = ({ remainingSeconds, endAt, compact = false, glow = false }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      let total;
      if (endAt) {
        const now = Date.now();
        const end = parseLocalDateTime(endAt)?.getTime();
        total = end ? Math.max(0, Math.floor((end - now) / 1000)) : 0;
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
  const isEnded = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  if (isEnded) {
    return (
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
        <span className="text-white/50 font-bold text-sm">Đã kết thúc</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1 sm:gap-1.5",
      glow && "bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-yellow-400/30 shadow-[0_0_20px_rgba(253,224,71,0.15)]"
    )}>
      {days > 0 && (
        <>
          <FlipDigit value={days} label="Ngày" glow={glow} />
          <Colon glow={glow} />
        </>
      )}
      <FlipDigit value={hours} label="Giờ" glow={glow} />
      <Colon glow={glow} />
      <FlipDigit value={minutes} label="Phút" glow={glow} />
      <Colon glow={glow} />
      <FlipDigit value={seconds} label="Giây" glow={glow} />
    </div>
  );
};

export default CountdownTimer;
