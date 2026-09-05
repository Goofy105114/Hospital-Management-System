/**
 * Going Merry Hospital Management System — Design Tokens
 * Conforming to PRD Section A.7 and A.4.11 Frontend Conventions
 * High-trust clinical palette with accessible contrast and friendly geometry.
 */

export const tokens = {
  colors: {
    // Primary Clinical Healthcare Palette
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0284c7', // Primary medical blue
      600: '#0369a1',
      700: '#075985',
      800: '#0c4a6e',
      900: '#082f49',
    },
    // Hospital Teal Accents (Clinical Hygiene & Care)
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
    },
    // Neutrals / Clinical Slate
    slate: {
      25: '#fcfcfd',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // Clinical Status & Triage Colors
    status: {
      success: {
        bg: '#ecfdf5',
        text: '#065f46',
        border: '#a7f3d0',
        solid: '#10b981',
      },
      warning: {
        bg: '#fffbeb',
        text: '#92400e',
        border: '#fde68a',
        solid: '#f59e0b',
      },
      danger: {
        bg: '#fef2f2',
        text: '#991b1b',
        border: '#fecaca',
        solid: '#ef4444',
      },
      info: {
        bg: '#f0f9ff',
        text: '#075985',
        border: '#bae6fd',
        solid: '#0284c7',
      },
    },
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
} as const;

export type Tokens = typeof tokens;
