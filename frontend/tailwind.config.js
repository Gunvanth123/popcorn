/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Midnight Indigo design system
        midnight: '#0a0a1a',     // page bg
        ink: '#141432',          // surface
        abyss: '#1e1e5a',        // raised surface
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',       // primary accent
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // GameCorn mode accent (cyan complements indigo on midnight bg)
        game: {
          DEFAULT: '#06b6d4',
          glow: '#22d3ee',
        },
        primary: '#4f46e5',
      },
      backgroundImage: {
        'indigo-glow': 'radial-gradient(circle at 30% 20%, rgba(79,70,229,0.35), transparent 60%), radial-gradient(circle at 80% 80%, rgba(30,30,90,0.6), transparent 55%)',
        'game-glow': 'radial-gradient(circle at 30% 20%, rgba(6,182,212,0.35), transparent 60%), radial-gradient(circle at 80% 80%, rgba(30,30,90,0.6), transparent 55%)',
      },
      boxShadow: {
        'glow-indigo': '0 10px 40px -10px rgba(79, 70, 229, 0.55), 0 0 24px -8px rgba(99,102,241,0.4)',
        'glow-game': '0 10px 40px -10px rgba(6, 182, 212, 0.55), 0 0 24px -8px rgba(34,211,238,0.4)',
      },
    },
  },
  plugins: [],
}
