import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette derived from the provided logo
        brand: {
          900: '#041f36',
          800: '#063153',
          700: '#0b4f8a',
          500: '#1ea6ff',
          300: '#9be7ff',
          100: '#e6f9ff',
        },
        // Accent colors
        accent: {
          red: '#ff4d4f',
        },
        // Semantic aliases
        primary: '#0b4f8a',
        secondary: '#1ea6ff',
        danger: '#ff4d4f',
        warning: '#f59e0b',
        success: '#10b981',
      },
    },
  },
  plugins: [],
}
export default config
