const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/;

export const parseLocalDateTime = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'string') {
    const match = value.match(DATETIME_LOCAL_RE);
    if (match) {
      const [, year, month, day, hour, minute, second = '0'] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        0
      );
    }
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const getFlashSaleStatus = (item, nowMs = Date.now()) => {
  const startAt = parseLocalDateTime(item?.startAt);
  const endAt = parseLocalDateTime(item?.endAt);

  if (!startAt || !endAt) {
    return {
      status: 'ENDED',
      isUpcoming: false,
      isRunning: false,
      isEnded: true,
      remainingSeconds: 0,
    };
  }

  const startMs = startAt.getTime();
  const endMs = endAt.getTime();
  const isUpcoming = nowMs < startMs;
  const isRunning = nowMs >= startMs && nowMs <= endMs;
  const isEnded = nowMs > endMs;
  const targetMs = isUpcoming ? startMs : isRunning ? endMs : nowMs;

  return {
    status: isUpcoming ? 'UPCOMING' : isRunning ? 'RUNNING' : 'ENDED',
    isUpcoming,
    isRunning,
    isEnded,
    remainingSeconds: Math.max(0, Math.floor((targetMs - nowMs) / 1000)),
  };
};

export const withFlashSaleStatus = (item, nowMs = Date.now()) => ({
  ...item,
  ...getFlashSaleStatus(item, nowMs),
});

export const formatFlashSaleDate = (value, options) => {
  const date = parseLocalDateTime(value);
  return date ? date.toLocaleDateString('vi-VN', options) : '';
};

export const formatFlashSaleTime = (value, options = { hour: '2-digit', minute: '2-digit' }) => {
  const date = parseLocalDateTime(value);
  return date ? date.toLocaleTimeString('vi-VN', options) : '';
};
