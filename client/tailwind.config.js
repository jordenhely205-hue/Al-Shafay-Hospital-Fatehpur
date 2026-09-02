/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#081E48',
          blue: '#0B3B82',
          primary: '#0B4F9C',
          cyan: '#0284C7',
          teal: '#06B6D4',
          surface: '#F8FAFC',
          card: '#FFFFFF',
        },
        medical: {
          deep: '#081E48',
          royal: '#0B3B82',
          blue: '#0B4F9C',
          cyan: '#0284C7',
          teal: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          slate: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        outfit: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        urdu: ['Noto Nastaliq Urdu', 'Urdu Typesetting', 'Jameel Noori Nastaleeq', 'Arial', 'sans-serif'],
      },
      animation: {
        'float-3d': 'logoFloat3D 4s ease-in-out infinite',
        'marquee-smooth': 'marqueeScroll 25s linear infinite',
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        logoFloat3D: {
          '0%, 100%': { transform: 'translateY(0) rotateY(0deg) rotateX(0deg)' },
          '50%': { transform: 'translateY(-4px) rotateY(6deg) rotateX(3deg)' },
        },
        marqueeScroll: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}

