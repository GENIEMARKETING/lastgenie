import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'genie-blue': 'var(--genie-blue)',
        'genie-pink': 'var(--genie-pink)',
        'genie-purple': 'var(--genie-purple)',
        'brand-primary': 'var(--color-brand-primary)',
        'brand-secondary': 'var(--color-brand-secondary)',
        'brand-accent': 'var(--color-brand-accent)',
        'background': 'var(--color-background)',
        'surface': 'var(--color-surface)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-accent': 'var(--color-text-accent)',
        'border-default': 'var(--color-border-default)',
        'border-interactive': 'var(--color-border-interactive)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
        'primary': 'var(--color-brand-primary)',
        'secondary': 'var(--color-brand-secondary)',
        'accent': 'var(--color-brand-accent)',
        'foreground': 'var(--color-text-primary)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'lg': '0.75rem',
        'full': '9999px',
      },
    },
  },
  plugins: [],
};

export default config;