/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          dim: 'rgb(var(--paper-dim) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        violet: {
          50: '#F4F0FF',
          100: '#E7DEFF',
          200: '#C9B4FF',
          300: '#A78BFA',
          400: '#8B5CF6',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
        },
        ice: {
          200: '#D4EEEF',
          300: '#A8DADC',
          400: '#7FC7CA',
          500: '#56AEB2',
          600: '#3D8A8E',
        },
        cyan: {
          400: '#5FD4E0',
          500: '#22B8CF',
          600: '#0E9AAE',
        },
        navy: {
          400: '#233876',
          500: '#12235C',
          600: '#03045E',
          700: '#020340',
          900: '#04050F',
        },
        citrine: {
          300: '#FBE28A',
          400: '#F7D24E',
          500: '#F4C430',
          600: '#D9A916',
        },
        pine: {
          400: '#2E8A73',
          500: '#1F6F5C',
          600: '#175747',
        },
        ember: {
          400: '#E8734A',
          500: '#D95E33',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      zIndex: {
        card: '10',
        nav: '20',
        dropdown: '50',
        dialog: '100',
        toast: '200',
      },
      boxShadow: {
        card: '0 1px 2px rgba(3,4,94,0.06), 0 8px 24px -12px rgba(3,4,94,0.14)',
        lift: '0 16px 48px -16px rgba(3,4,94,0.32)',
        glass: '0 8px 32px -8px rgba(3,4,94,0.2), inset 0 1px 0 0 rgba(255,255,255,0.4)',
        glow: '0 0 0 1px rgba(124,58,237,0.15), 0 8px 32px -4px rgba(124,58,237,0.35)',
        'glow-dark': '0 0 0 1px rgba(167,139,250,0.25), 0 8px 40px -4px rgba(124,58,237,0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #03045E 0%, #6D28D9 55%, #22B8CF 100%)',
        'gradient-violet-cyan': 'linear-gradient(120deg, #6D28D9 0%, #22B8CF 100%)',
        'gradient-navy-violet': 'linear-gradient(135deg, #03045E 0%, #4C1D95 100%)',
        'gradient-mesh': 'radial-gradient(at 20% 20%, rgba(124,58,237,0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(34,184,207,0.2) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(3,4,94,0.15) 0px, transparent 50%)',
        'gradient-mesh-dark': 'radial-gradient(at 15% 15%, rgba(124,58,237,0.35) 0px, transparent 55%), radial-gradient(at 85% 10%, rgba(34,184,207,0.28) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(3,4,94,0.4) 0px, transparent 55%)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      keyframes: {
        'fan-in': {
          '0%': { opacity: '0', transform: 'translateY(24px) rotate(var(--rot-from,0deg))' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(var(--rot-to,0deg))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fan-in': 'fan-in 0.7s cubic-bezier(0.16,1,0.3,1) both',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};
