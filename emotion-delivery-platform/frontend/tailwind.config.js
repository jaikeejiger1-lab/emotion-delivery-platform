/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — deep rose gold / midnight luxury
        brand: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#E85D9A', // Primary
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#D4AF37', // Classic gold
          600: '#b8952e',
        },
        dark: {
          900: '#0D0D1A', // Deep midnight
          800: '#13132a',
          700: '#1A1A3E',
          600: '#252550',
          500: '#2f2f60',
        },
        glass: 'rgba(255, 255, 255, 0.06)',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        cursive: ['"Dancing Script"', 'cursive'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #E85D9A 0%, #8B5CF6 100%)',
        'gradient-gold':  'linear-gradient(135deg, #D4AF37 0%, #E85D9A 100%)',
        'gradient-dark':  'linear-gradient(180deg, #0D0D1A 0%, #1A1A3E 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'slide-up':    'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232, 93, 154, 0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(232, 93, 154, 0.7)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%':   { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { '4xl': '2rem', '5xl': '3rem' },
    },
  },
  plugins: [],
};
