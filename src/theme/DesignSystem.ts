import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// ============================================
// COLORS - Premium Dark Theme
// ============================================
export const COLORS = {
    // Bases
    background: '#0A0F1A',        // Deeper, richer dark
    surface: '#141B2D',           // Slightly lighter surface
    surfaceHighlight: '#1F2937',  // Hover/active states
    surfaceElevated: '#1E293B',   // Cards, modals

    // Primary Gradient Colors
    primary: '#3B82F6',           // Blue 500
    primaryLight: '#60A5FA',      // Blue 400
    primaryDark: '#2563EB',       // Blue 600
    primaryGlow: 'rgba(59, 130, 246, 0.4)',

    // Secondary/Accent
    secondary: '#10B981',         // Emerald 500
    secondaryGlow: 'rgba(16, 185, 129, 0.4)',

    // Accent Gradient (Purple to Blue)
    accentStart: '#818CF8',       // Indigo 400
    accentEnd: '#3B82F6',         // Blue 500

    accent: '#F43F5E',            // Rose 500
    accentGlow: 'rgba(244, 63, 94, 0.4)',

    // Text Hierarchy
    text: '#F8FAFC',              // Slate 50 - Primary text
    textSecondary: '#E2E8F0',     // Slate 200 - Secondary text
    textMuted: '#94A3B8',         // Slate 400 - Muted text
    textDim: '#64748B',           // Slate 500 - Disabled/placeholder

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.75)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',

    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.12)',
    borderFocus: 'rgba(59, 130, 246, 0.5)',

    // Status
    error: '#EF4444',             // Red 500
    success: '#10B981',           // Emerald 500
    warning: '#F59E0B',           // Amber 500
};

// ============================================
// SPACING - Consistent rhythm
// ============================================
export const SPACING = {
    xxs: 2,
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

// ============================================
// BORDER RADIUS - Refined corners
// ============================================
export const RADIUS = {
    xs: 6,
    s: 10,
    m: 14,
    l: 20,
    xl: 28,
    full: 9999,
};

// ============================================
// TYPOGRAPHY
// ============================================
export const FONTS = {
    bold: Platform.select({ ios: 'System', android: 'Roboto' }),
    regular: Platform.select({ ios: 'System', android: 'Roboto' }),
};

export const FONT_SIZES = {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    display: 48,
};

// ============================================
// ALERTS
// ============================================
export const ALERTS = {
    success: '#10B981',
    successGlow: 'rgba(16, 185, 129, 0.3)',
    error: '#EF4444',
    errorGlow: 'rgba(239, 68, 68, 0.3)',
    warning: '#F59E0B',
    warningGlow: 'rgba(245, 158, 11, 0.3)',
    info: '#3B82F6',
    infoGlow: 'rgba(59, 130, 246, 0.3)',
};

// ============================================
// GLASSMORPHISM - Premium glass effects
// ============================================
export const GLASS = {
    card: {
        backgroundColor: 'rgba(20, 27, 45, 0.8)',
        borderColor: COLORS.border,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    cardElevated: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        borderColor: COLORS.borderLight,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
    },
    input: {
        backgroundColor: 'rgba(10, 15, 26, 0.7)',
        borderColor: COLORS.border,
        borderWidth: 1,
    },
    inputFocused: {
        backgroundColor: 'rgba(10, 15, 26, 0.9)',
        borderColor: COLORS.borderFocus,
        borderWidth: 1.5,
    },
};

// ============================================
// SHADOWS - Depth hierarchy
// ============================================
export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
    }),
    primaryGlow: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
};

// ============================================
// ANIMATION TIMING
// ============================================
export const ANIMATION = {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
        damping: 15,
        stiffness: 150,
        mass: 1,
    },
    springBouncy: {
        damping: 12,
        stiffness: 180,
        mass: 0.8,
    },
    springSmooth: {
        damping: 20,
        stiffness: 120,
        mass: 1,
    },
};

// ============================================
// GRADIENTS
// ============================================
export const GRADIENTS = {
    primary: ['#3B82F6', '#2563EB'],
    accent: ['#818CF8', '#3B82F6'],
    success: ['#10B981', '#059669'],
    sunset: ['#F43F5E', '#FB923C'],
    dark: ['#0A0F1A', '#141B2D'],
    story: ['#3B82F6', '#1D4ED8', '#1E3A8A'],
    surface: ['#141B2D', '#1F2937'],
    overlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
};

// ============================================
// SCREEN DIMENSIONS
// ============================================
export const SCREEN = {
    width,
    height,
    isSmall: width < 375,
    isMedium: width >= 375 && width < 414,
    isLarge: width >= 414,
};

// ============================================
// INPUT STYLES - Consistent form elements
// ============================================
export const INPUT_STYLES = {
    container: {
        backgroundColor: GLASS.input.backgroundColor,
        borderColor: GLASS.input.borderColor,
        borderWidth: GLASS.input.borderWidth,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 56,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    containerFocused: {
        backgroundColor: GLASS.inputFocused.backgroundColor,
        borderColor: GLASS.inputFocused.borderColor,
        borderWidth: GLASS.inputFocused.borderWidth,
    },
    text: {
        flex: 1,
        color: COLORS.text,
        fontSize: FONT_SIZES.m,
        paddingVertical: SPACING.m,
    },
    label: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.s,
        fontWeight: '500' as const,
        marginBottom: SPACING.s,
        marginLeft: SPACING.xs,
    },
    placeholder: COLORS.textDim,
};

// ============================================
// BUTTON STYLES - Refined buttons
// ============================================
export const BUTTON_STYLES = {
    height: 54,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.l,
};

// ============================================
// WARM THEME (Updated to CONSTRUCTION BLUE)
// ============================================
export const COLORS_WARM = {
    // Bases (Cooler, Professional)
    background: '#F1F5F9',        // Slate 100
    surface: '#FFFFFF',           // Pure white
    surfaceHighlight: '#E2E8F0',  // Slate 200
    surfaceElevated: '#FFFFFF',

    // Primary (Deep Industrial Blue)
    primary: '#1136AA',           // Stronger, Deeper Blue
    primaryLight: '#3A66D8',      // Lighter Royal
    primaryDark: '#0A2472',       // Navy
    primaryGlow: 'rgba(17, 54, 170, 0.3)',

    // Secondary (Teal/Green - Status)
    secondary: '#059669',         // Emerald 600
    secondaryGlow: 'rgba(5, 150, 105, 0.3)',

    // Accent (Safety Orange/Yellow for Contrast)
    accent: '#F59E0B',            // Amber 500
    accentStart: '#1136AA',       // Deep Blue
    accentEnd: '#3A66D8',         // Royal Blue
    accentGlow: 'rgba(58, 102, 216, 0.3)',

    // Text Hierarchy (Dark on Light)
    text: '#0F172A',              // Slate 900
    textSecondary: '#334155',     // Slate 700
    textMuted: '#64748B',         // Slate 500
    textDim: '#94A3B8',           // Slate 400

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(15, 23, 42, 0.6)',
    overlayLight: 'rgba(15, 23, 42, 0.3)',

    // Borders
    border: '#E2E8F0',            // Slate 200
    borderLight: '#F1F5F9',       // Slate 100
    borderFocus: '#1136AA',       // Blue Focus

    // Status
    error: '#EF4444',             // Red 500
    success: '#10B981',           // Emerald 500
    warning: '#F59E0B',           // Amber 500
};

export const GRADIENTS_WARM = {
    primary: ['#1136AA', '#0A2472'],  // Deep Royal -> Navy
    accent: ['#3A66D8', '#1136AA'],   // Lighter -> Deep
    success: ['#10B981', '#059669'],
    sunset: ['#F59E0B', '#EA580C'],   // Amber -> Orange
    dark: ['#F1F5F9', '#E2E8F0'],     // Fallback for light mode
    story: ['#3B82F6', '#1D4ED8', '#1E3A8A'],
    surface: ['#FFFFFF', '#F8FAFC'],
    overlay: ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.8)'],
};

export const GLASS_WARM = {
    card: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0, 0, 0, 0.06)',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardElevated: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
    },
    inputFocused: {
        backgroundColor: '#FFFFFF',
        borderColor: '#1136AA',
        borderWidth: 1.5,
    },
};

// ============================================
// THEME EXPORT FOR CONTEXT
// ============================================
export const THEMES = {
    dark: {
        colors: COLORS,
        gradients: GRADIENTS,
        glass: GLASS,
        spacing: SPACING,
        radius: RADIUS,
        fontSizes: FONT_SIZES,
    },
    light: {
        colors: COLORS_WARM,
        gradients: GRADIENTS_WARM,
        glass: GLASS_WARM,
        spacing: SPACING,
        radius: RADIUS,
        fontSizes: FONT_SIZES,
    }
};
