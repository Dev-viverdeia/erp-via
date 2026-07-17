import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },

        /* Status semantico */
        "status-success": {
          DEFAULT: "hsl(var(--status-success))",
          light: "hsl(var(--status-success-light))",
          lighter: "hsl(var(--status-success-lighter))",
          dark: "hsl(var(--status-success-dark))",
        },
        "status-error": {
          DEFAULT: "hsl(var(--status-error))",
          light: "hsl(var(--status-error-light))",
          lighter: "hsl(var(--status-error-lighter))",
          dark: "hsl(var(--status-error-dark))",
        },
        "status-warning": {
          DEFAULT: "hsl(var(--status-warning))",
          light: "hsl(var(--status-warning-light))",
          lighter: "hsl(var(--status-warning-lighter))",
          dark: "hsl(var(--status-warning-dark))",
        },
        "status-info": {
          DEFAULT: "hsl(var(--status-info))",
          light: "hsl(var(--status-info-light))",
          lighter: "hsl(var(--status-info-lighter))",
          dark: "hsl(var(--status-info-dark))",
        },
        "status-neutral": {
          DEFAULT: "hsl(var(--status-neutral))",
          light: "hsl(var(--status-neutral-light))",
          lighter: "hsl(var(--status-neutral-lighter))",
          dark: "hsl(var(--status-neutral-dark))",
        },

        /* Financial */
        revenue: {
          DEFAULT: "hsl(var(--revenue))",
          light: "hsl(var(--revenue-light))",
          lighter: "hsl(var(--revenue-lighter))",
          dark: "hsl(var(--revenue-dark))",
        },
        expense: {
          DEFAULT: "hsl(var(--expense))",
          light: "hsl(var(--expense-light))",
          lighter: "hsl(var(--expense-lighter))",
          dark: "hsl(var(--expense-dark))",
        },
        profit: {
          DEFAULT: "hsl(var(--profit))",
          light: "hsl(var(--profit-light))",
          lighter: "hsl(var(--profit-lighter))",
          dark: "hsl(var(--profit-dark))",
        },

        /* Legacy alias */
        "aurora-primary": {
          DEFAULT: "hsl(var(--aurora-primary))",
          light: "hsl(var(--aurora-primary-light))",
          dark: "hsl(var(--aurora-primary-dark))",
        },

        /* Charts */
        "chart-1": "hsl(var(--chart-1))",
        "chart-2": "hsl(var(--chart-2))",
        "chart-3": "hsl(var(--chart-3))",
        "chart-4": "hsl(var(--chart-4))",
        "chart-5": "hsl(var(--chart-5))",
      },
      fontSize: {
        /* Design system tokens — named aliases for consistent usage */
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],    /* 10px — table headers, micro labels */
        xs: ["0.6875rem", { lineHeight: "1rem" }],           /* 11px — uppercase labels, tracking badges */
        sm: ["0.75rem", { lineHeight: "1rem" }],             /* 12px — captions, metadata, dates */
        base: ["0.8125rem", { lineHeight: "1.25rem" }],      /* 13px — body text, table cells, buttons */
        md: ["0.875rem", { lineHeight: "1.25rem" }],         /* 14px — emphasized body, bold values */
        lg: ["0.9375rem", { lineHeight: "1.375rem" }],       /* 15px — card titles, section headings */
        xl: ["1rem", { lineHeight: "1.5rem" }],              /* 16px — large body, sub-headings */
        "2xl": ["1.25rem", { lineHeight: "1.75rem" }],       /* 20px — KPI values, page sub-titles */
        "3xl": ["1.5rem", { lineHeight: "2rem" }],           /* 24px — page headings */
        "4xl": ["1.875rem", { lineHeight: "2.25rem" }],      /* 30px — hero titles */
        "5xl": ["2.25rem", { lineHeight: "2.5rem" }],        /* 36px — large hero titles */
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      height: {
        "chart-sm": "200px",
        "chart-md": "300px",
        "chart-lg": "400px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
