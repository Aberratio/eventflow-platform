import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        /* === BRAND STATIC TOKENS === */
        brand: {
          navy: 'hsl(var(--color-brand-navy) / <alpha-value>)' /* primary brand navy */,
          'navy-light': 'hsl(var(--color-brand-navy-light) / <alpha-value>)' /* emphasis / glow */,
          'navy-dark': 'hsl(var(--color-brand-navy-dark) / <alpha-value>)' /* hover state */,
          black: 'hsl(var(--color-brand-black) / <alpha-value>)',
          gray: {
            '50': 'hsl(var(--color-gray-50) / <alpha-value>)',
            '100': 'hsl(var(--color-gray-100) / <alpha-value>)',
            '200': 'hsl(var(--color-gray-200) / <alpha-value>)',
            '300': 'hsl(var(--color-gray-300) / <alpha-value>)',
            '400': 'hsl(var(--color-gray-400) / <alpha-value>)',
            '500': 'hsl(var(--color-gray-500) / <alpha-value>)',
            '600': 'hsl(var(--color-gray-600) / <alpha-value>)',
            '700': 'hsl(var(--color-gray-700) / <alpha-value>)',
            '800': 'hsl(var(--color-gray-800) / <alpha-value>)',
            '900': 'hsl(var(--color-gray-900) / <alpha-value>)',
          },
        },
        /* === SEMANTIC TOKENS (CSS variables) === */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        runner: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
        'runner-legs': {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)', opacity: '1' },
          '20%': { transform: 'translate(-3px, 3px)', opacity: '0.8' },
          '40%': { transform: 'translate(3px, -3px)', opacity: '0.9' },
          '60%': { transform: 'translate(-3px, -3px)', opacity: '0.8' },
          '80%': { transform: 'translate(3px, 3px)', opacity: '0.9' },
        },
        'glitch-skew': {
          '0%, 100%': { transform: 'skewX(0deg)' },
          '20%': { transform: 'skewX(-5deg)' },
          '40%': { transform: 'skewX(5deg)' },
          '60%': { transform: 'skewX(-3deg)' },
          '80%': { transform: 'skewX(3deg)' },
        },
        blink: {
          '0%, 50%, 100%': { opacity: '1' },
          '25%, 75%': { opacity: '0' },
        },
        'stopwatch-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        'digit-scramble': {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-2px)' },
          '50%': { transform: 'translateY(2px)' },
          '75%': { transform: 'translateY(-1px)' },
        },
        spark: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-30px) scale(0)', opacity: '0' },
        },
        'shake-head': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-10deg)' },
          '75%': { transform: 'rotate(10deg)' },
        },
        'water-drink': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-30deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'tape-wave': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(0.95)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        runner: 'runner 0.5s ease-in-out infinite',
        'runner-legs': 'runner-legs 0.3s ease-in-out infinite',
        glitch: 'glitch 0.3s ease-in-out infinite',
        'glitch-skew': 'glitch-skew 0.5s ease-in-out infinite',
        blink: 'blink 1s ease-in-out infinite',
        'stopwatch-pulse': 'stopwatch-pulse 2s ease-in-out infinite',
        'digit-scramble': 'digit-scramble 0.15s ease-in-out infinite',
        spark: 'spark 0.6s ease-out forwards',
        'shake-head': 'shake-head 0.5s ease-in-out infinite',
        'water-drink': 'water-drink 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'tape-wave': 'tape-wave 1s ease-in-out infinite',
      },
      boxShadow: {
        '2xs': 'var(--shadow-2xs)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        serif: ['Lora', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        mono: [
          'Inconsolata',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
