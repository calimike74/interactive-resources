// Botanical Press Design Token System
// Re-pointed 2026-08-12 (WO-05 batch A) from the original blue/white
// "Educational Design Token System" onto the house Botanical Press
// palette (repo DESIGN.md + Professional/Planning-and-Admin/Design-With-This!/BRAND.md).
// success/warning/error stay untouched deliberately — BRAND.md: "the existing
// Green/Yellow/Red system stays (it's a learning signal, not a brand colour)".

/**
 * Botanical Press Theme
 * Light mode default — the site's only reachable mode in practice; dark
 * mode is aligned to BRAND.md's documented dark tokens but nothing in the
 * app currently switches to it.
 */
export const theme = {
    // Light mode (default) — warm cream ground, editorial ink, earthen accents
    light: {
        bg: {
            primary: '#F2EBE0',      // Main background — cream ground
            secondary: '#F8F2E8',    // Subtle sections, alternating rows — paper
            tertiary: '#F8F2E8',     // Cards, panels — paper
            canvas: '#F8F2E8',       // Drawing area — paper
            elevated: '#F8F2E8',     // Modals, dropdowns — paper
        },
        text: {
            primary: '#1F2A1C',      // Headings — ink
            secondary: '#1F2A1C',    // Body text — ink (Botanical Press uses one ink for both)
            tertiary: '#6B6F5C',     // Captions, hints, disabled — muted
            inverse: '#F2EBE0',      // On dark/accent (Field) backgrounds — cream
            link: '#3A4A35',         // Links — field
        },
        accent: {
            primary: '#3A4A35',      // Primary actions, links — field (moss)
            primaryHover: '#2D3A2A', // Primary hover state — field-deep
            success: '#059669',      // Correct, complete (green) — traffic-light, unchanged
            successLight: '#D1FAE5', // Success background — unchanged
            warning: '#D97706',      // Attention, caution (amber) — traffic-light, unchanged
            warningLight: '#FEF3C7', // Warning background — unchanged
            error: '#DC2626',        // Errors, incorrect (red) — traffic-light, unchanged
            errorLight: '#FEE2E2',   // Error background — unchanged
            info: '#C99F44',         // Information — mustard (texture/highlight, never errors)
            infoLight: '#FAF6E8',    // Info background — mustard-50
        },
        border: {
            subtle: '#D4C9B4',       // Subtle separators — line
            medium: '#D4C9B4',       // Card borders — line
            strong: '#6B6F5C',       // Emphasized borders — muted
            focus: '#3A4A35',        // Focus rings — field
            input: '#D4C9B4',        // Form input borders — line
        },
        shadow: {
            // Paper-on-paper vocabulary from DESIGN.md §4 — warm ink-tinted, never grey/black.
            sm: '0 1px 0 rgba(43,36,24,0.06), 0 8px 24px -16px rgba(43,36,24,0.18)',
            md: '0 1px 0 rgba(43,36,24,0.06), 0 8px 24px -16px rgba(43,36,24,0.18)',
            lg: '0 1px 0 rgba(43,36,24,0.04), 0 18px 40px -24px rgba(43,36,24,0.22)',
        },
    },

    // Dark mode — aligned to BRAND.md's documented dark tokens; not currently reachable in the UI
    dark: {
        bg: {
            primary: '#1F2A1C',      // Main background — deep forest
            secondary: '#28341F',    // Subtle sections — elevated dark
            tertiary: '#28341F',     // Cards, panels — elevated dark
            canvas: '#28341F',       // Drawing area — elevated dark
            elevated: '#28341F',     // Modals, dropdowns — elevated dark
        },
        text: {
            primary: '#F2EBE0',      // Headings — cream
            secondary: '#F2EBE0',    // Body text — cream
            tertiary: '#A8A696',     // Captions, hints — muted (dark)
            inverse: '#1F2A1C',      // On light backgrounds — deep forest
            link: '#F2EBE0',         // Links — cream (field reverses on dark)
        },
        accent: {
            primary: '#F2EBE0',      // Primary actions — field reverses to cream on dark
            primaryHover: '#BCC2A8', // Primary hover — field-soft (dark)
            success: '#10B981',      // Correct, complete — traffic-light, unchanged
            successLight: '#064E3B', // Success background — unchanged
            warning: '#F59E0B',      // Attention — traffic-light, unchanged
            warningLight: '#78350F', // Warning background — unchanged
            error: '#EF4444',        // Errors — traffic-light, unchanged
            errorLight: '#7F1D1D',   // Error background — unchanged
            info: '#E2BC60',         // Information — mustard (lifted for dark contrast)
            infoLight: '#4a3d1c',    // Info background — mustard tint (dark)
        },
        border: {
            subtle: '#2D3925',
            medium: '#2D3925',
            strong: '#A8A696',
            focus: '#F2EBE0',
            input: '#2D3925',
        },
        shadow: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        },
    },
};

export const glass = {
    bg: 'rgba(255, 255, 255, 0.65)',
    bgHover: 'rgba(255, 255, 255, 0.85)',
    bgPrimary: 'rgba(37, 99, 235, 0.88)',
    bgPrimaryHover: 'rgba(29, 78, 216, 0.92)',
    bgSuccess: 'rgba(5, 150, 105, 0.85)',
    bgSuccessHover: 'rgba(4, 120, 87, 0.90)',
    bgDanger: 'rgba(220, 38, 38, 0.85)',
    bgDangerHover: 'rgba(185, 28, 28, 0.90)',
    bgWarning: 'rgba(217, 119, 6, 0.85)',
    bgWarningHover: 'rgba(180, 83, 9, 0.90)',
    bgGhost: 'transparent',
    bgGhostHover: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.6)',
    borderOuter: 'rgba(0, 0, 0, 0.08)',
    shadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    shadowHover: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    shadowPrimary: '0 4px 20px rgba(37, 99, 235, 0.3), 0 1px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    shadowPrimaryHover: '0 8px 32px rgba(37, 99, 235, 0.4), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
    blur: '12px',
    radius: '12px',
    radiusPill: '999px',
    iconBg: 'rgba(255, 255, 255, 0.7)',
    iconBorder: 'rgba(255, 255, 255, 0.8)',
    iconShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
};

/**
 * Typography System
 * Minimum 16px body text for readability
 *
 * The original note here read "using system fonts for fast loading and native
 * feel". That predates Botanical Press being committed as the design language,
 * and it is why the front door rendered in Fraunces/Manrope while every tool
 * page behind it rendered in the visitor's OS font. Manrope now leads, with the
 * old system stack kept intact behind it: if the variable ever fails to
 * resolve, the page lands on exactly the previous behaviour. The font is
 * already loaded by the root layout, so this costs no extra request.
 */
export const typography = {
    fontFamily: 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilySerif: 'var(--font-instrument-serif), "Georgia", "Times New Roman", serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',

    size: {
        xs: '0.75rem',      // 12px - Tiny labels
        sm: '0.875rem',     // 14px - Small text, captions
        base: '1rem',       // 16px - Body text (minimum for accessibility)
        lg: '1.125rem',     // 18px - Emphasized body
        xl: '1.25rem',      // 20px - Card titles, h4
        '2xl': '1.5rem',    // 24px - Section headings, h3
        '3xl': '1.875rem',  // 30px - Page subtitles, h2
        '4xl': '2.25rem',   // 36px - Page titles, h1
    },

    lineHeight: {
        tight: 1.25,        // Headings
        snug: 1.375,        // Subheadings
        normal: 1.5,        // Body text
        relaxed: 1.625,     // Extended reading
        loose: 1.75,        // Instructions, hints
    },

    weight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    letterSpacing: {
        tight: '-0.025em',  // Headings
        normal: '0',
        wide: '0.025em',    // All caps, labels
    },
};

/**
 * Spacing System (8px base)
 */
export const spacing = {
    0: '0',
    0.5: '0.125rem',   // 2px
    1: '0.25rem',      // 4px
    2: '0.5rem',       // 8px
    3: '0.75rem',      // 12px
    4: '1rem',         // 16px
    5: '1.25rem',      // 20px
    6: '1.5rem',       // 24px
    8: '2rem',         // 32px
    10: '2.5rem',      // 40px
    12: '3rem',        // 48px
    16: '4rem',        // 64px
    20: '5rem',        // 80px
};

/**
 * Border Radius
 */
export const borderRadius = {
    none: '0',
    sm: '0.25rem',     // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    full: '9999px',    // Pills, circles
};

/**
 * Breakpoints for responsive design
 */
const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

/**
 * Editorial palette — single accent, no per-topic colours.
 */
export const editorial = {
    ink: '#181410',
    inkSoft: '#4d463c',
    inkFade: '#8a8175',
    rule: '#d9d1be',
    ruleSoft: '#e8e1cc',
    accent: '#2d5d4f',
    accentTint: 'rgba(45, 93, 79, 0.08)',
    accentFaint: 'rgba(45, 93, 79, 0.18)',
    accentMid: 'rgba(45, 93, 79, 0.30)',
    serif: 'var(--font-fraunces), Georgia, serif',
    sans: 'var(--font-manrope), -apple-system, sans-serif',
    mono: 'var(--font-jbmono), ui-monospace, monospace',
};

/**
 * Transitions
 */
export const transitions = {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    spring: 'linear(0, 0.18, 0.42, 0.72, 0.95, 1.06, 1.04, 1.01, 0.99, 1)',
    springDuration: '500ms',
};

/**
 * Focus ring styles for accessibility
 */
export const focusRing = (mode = 'light') => ({
    outline: 'none',
    boxShadow: `0 0 0 2px ${mode === 'light' ? theme.light.bg.primary : theme.dark.bg.primary}, 0 0 0 4px ${mode === 'light' ? theme.light.border.focus : theme.dark.border.focus}`,
});

/**
 * Helper to get current theme based on mode
 */
function getTheme(mode = 'light') {
    return theme[mode] || theme.light;
}

/**
 * Helper to create CSS custom properties from theme
 */
function getCSSVariables(mode = 'light') {
    const t = getTheme(mode);
    return {
        '--bg-primary': t.bg.primary,
        '--bg-secondary': t.bg.secondary,
        '--bg-tertiary': t.bg.tertiary,
        '--bg-canvas': t.bg.canvas,
        '--bg-elevated': t.bg.elevated,
        '--text-primary': t.text.primary,
        '--text-secondary': t.text.secondary,
        '--text-tertiary': t.text.tertiary,
        '--text-inverse': t.text.inverse,
        '--text-link': t.text.link,
        '--accent-primary': t.accent.primary,
        '--accent-primary-hover': t.accent.primaryHover,
        '--accent-success': t.accent.success,
        '--accent-warning': t.accent.warning,
        '--accent-error': t.accent.error,
        '--accent-info': t.accent.info,
        '--border-subtle': t.border.subtle,
        '--border-medium': t.border.medium,
        '--border-strong': t.border.strong,
        '--border-focus': t.border.focus,
        '--shadow-sm': t.shadow.sm,
        '--shadow-md': t.shadow.md,
        '--shadow-lg': t.shadow.lg,
    };
}

