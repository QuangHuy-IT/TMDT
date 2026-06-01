export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'shimmer': 'shimmer 2.5s linear infinite',
        'flip-top': 'flipTop 0.35s ease-in-out forwards',
        'flip-bottom': 'flipBottom 0.35s ease-in-out forwards',
        'flash-icon': 'flashIcon 1.5s ease-in-out infinite',
        'flash-badge': 'flashBadge 2s ease-in-out infinite',
        'fire-pulse': 'firePulse 1s ease-in-out infinite',
        'live-badge': 'liveBadge 1.5s ease-in-out infinite',
        'colon-blink': 'colonBlink 1s step-end infinite',
        'shimmer-move': 'shimmerMove 2.5s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%) skewX(-20deg)' },
          '100%': { transform: 'translateX(200%) skewX(-20deg)' },
        },
        flipTop: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(-90deg)' },
        },
        flipBottom: {
          '0%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        flashIcon: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
        flashBadge: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        firePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        liveBadge: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(252, 211, 77, 0.7)' },
          '50%': { boxShadow: '0 0 0 6px rgba(252, 211, 77, 0)' },
        },
        colonBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        shimmerMove: {
          '0%': { transform: 'translateX(-200%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(1.1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
      },
    },
  },
  plugins: [],
}