export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0a0f',
          'bg-secondary': '#12121a',
          'bg-card': '#1a1a25',
          'bg-card-hover': '#22222f',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        tier: {
          common: '#8b8b8b',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f59e0b',
          mythic: '#ef4444',
        },
        accent: {
          red: '#ef4444',
          amber: '#f59e0b',
          gold: '#ffd700',
          green: '#22c55e',
          blue: '#3b82f6',
          purple: '#a855f7',
        },
        // Semantic aliases matching CSS variables for use in Tailwind classes
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b0',
        'text-muted': '#606070',
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        slideUp: 'slideUp 0.6s ease-out forwards',
        scaleIn: 'scaleIn 0.4s ease-out forwards',
        shake: 'shake 0.4s ease-out',
        glow: 'glow 2s ease-in-out infinite',
        float: 'float 15s ease-in-out infinite',
        orbPulse: 'orbPulse 4s ease-in-out infinite',
        orbSpin1: 'orbSpin1 14s linear infinite',
        orbSpin2: 'orbSpin2 10s linear infinite',
        orbSpin3: 'orbSpin3 18s linear infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        confetti: 'confetti 3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-20px) rotate(90deg)' },
          '50%': { transform: 'translateY(0) rotate(180deg)' },
          '75%': { transform: 'translateY(20px) rotate(270deg)' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.18)', opacity: '0.85' },
        },
        orbSpin1: {
          from: { transform: 'rotateX(62deg) rotateZ(0deg)' },
          to: { transform: 'rotateX(62deg) rotateZ(360deg)' },
        },
        orbSpin2: {
          from: { transform: 'rotateY(68deg) rotateZ(0deg)' },
          to: { transform: 'rotateY(68deg) rotateZ(-360deg)' },
        },
        orbSpin3: {
          from: { transform: 'rotateX(48deg) rotateY(24deg) rotateZ(0deg)' },
          to: { transform: 'rotateX(48deg) rotateY(24deg) rotateZ(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
        confetti: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
