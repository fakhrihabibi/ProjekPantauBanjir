import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
    },
  },
  plugins: [],
}
export default config
