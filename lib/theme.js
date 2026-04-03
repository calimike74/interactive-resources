// Educational Design Token System
// Research-backed color palette and typography for A-level assessment platform
// Prioritizes accessibility (WCAG 2.1 AA), readability, and professional appearance

/**
 * Educational Theme
 * Light mode default - studies show better reading comprehension
 * Dark mode available for accessibility (light sensitivity)
 */
export const theme = {
    // Light mode (default) - optimized for educational clarity
    light: {
        bg: {
            primary: '#FFFFFF',      // Main background
            secondary: '#F8F9FA',    // Subtle sections, alternating rows
            tertiary: '#E9ECEF',     // Cards, panels
            canvas: '#FAFAFA',       // Drawing area (slight off-white)
            elevated: '#FFFFFF',     // Modals, dropdowns
        },
        text: {
            primary: '#1A1A2E',      // Headings - dark navy (7:1+ contrast)
            secondary: '#374151',    // Body text (5.5:1 contrast)
            tertiary: '#6B7280',     // Captions, hints, disabled
            inverse: '#FFFFFF',      // On dark/accent backgrounds
            link: '#2563EB',         // Links
        },
        accent: {
            primary: '#2563EB',      // Primary actions, links (blue)
            primaryHover: '#1D4ED8', // Primary hover state
            success: '#059669',      // Correct, complete (green)
            successLight: '#D1FAE5', // Success background
            warning: '#D97706',      // Attention, caution (amber)
            warningLight: '#FEF3C7', // Warning background
            error: '#DC2626',        // Errors, incorrect (red)
            errorLight: '#FEE2E2',   // Error background
            info: '#0891B2',         // Information (cyan)
            infoLight: '#CFFAFE',    // Info background
        },
        border: {
            subtle: '#E5E7EB',       // Subtle separators
            medium: '#D1D5DB',       // Card borders
            strong: '#9CA3AF',       // Emphasized borders
            focus: '#2563EB',        // Focus rings
            input: '#D1D5DB',        // Form input borders
        },
        shadow: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
    },

    // Dark mode (optional toggle) - for extended sessions or light sensitivity
    dark: {
        bg: {
            primary: '#1A1A2E',      // Main background
            secondary: '#16213E',    // Subtle sections
            tertiary: '#0F3460',     // Cards, panels
            canvas: '#252549',       // Drawing area
            elevated: '#1F1F3D',     // Modals, dropdowns
        },
        text: {
            primary: '#F8FAFC',      // Headings
            secondary: '#CBD5E1',    // Body text
            tertiary: '#94A3B8',     // Captions, hints
            inverse: '#1A1A2E',      // On light backgrounds
            link: '#60A5FA',         // Links
        },
        accent: {
            primary: '#3B82F6',      // Primary actions
            primaryHover: '#60A5FA', // Primary hover
            success: '#10B981',      // Correct, complete
            successLight: '#064E3B', // Success background
            warning: '#F59E0B',      // Attention
            warningLight: '#78350F', // Warning background
            error: '#EF4444',        // Errors
            errorLight: '#7F1D1D',   // Error background
            info: '#22D3EE',         // Information
            infoLight: '#164E63',    // Info background
        },
        border: {
            subtle: '#374151',
            medium: '#4B5563',
            strong: '#6B7280',
            focus: '#3B82F6',
            input: '#4B5563',
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
 * Using system fonts for fast loading and native feel
 * Minimum 16px body text for readability
 */
export const typography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
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
export function getTheme(mode = 'light') {
    return theme[mode] || theme.light;
}

/**
 * Helper to create CSS custom properties from theme
 */
export function getCSSVariables(mode = 'light') {
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

// Default export for convenience
export default {
    theme,
    glass,
    typography,
    spacing,
    borderRadius,
    breakpoints,
    transitions,
    focusRing,
    getTheme,
    getCSSVariables,
};
