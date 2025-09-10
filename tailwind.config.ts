// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'media', // ok anche 'class', ma non è necessario per il tuo toggle data-theme
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette "premium" — LIGHT
        'premium-surface':  '#ffffff',   // fondo base
        'premium-surface2': '#f5f7fb',   // blocchi/chips
        'premium-ink':      '#0f172a',   // testo primario (slate-900)
        'premium-sub':      '#475569',   // testo secondario (slate-600/700)
        'premium-line':     '#e2e8f0',   // bordi (slate-200)

        // Palette "premium" — DARK
        'premium-d_bg':     '#0b1220',   // sfondo pagina (navy molto scuro)
        'premium-d_card':   '#0f1726',   // card (navy scuro)
        'premium-d_text':   '#e5e7eb',   // testo (slate-200)
        'premium-d_line':   'rgba(255,255,255,.08)', // bordi sottili in dark

        // Brand accent
        ntf: {
          accent:  '#10b981', // emerald-500
          accent2: '#0ea371', // emerald-600 (hover)
        },
      },
    },
  },
  plugins: [],
}

export default config