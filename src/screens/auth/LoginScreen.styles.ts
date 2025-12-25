import { StyleSheet } from 'react-native';
import { THEMES, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../theme/DesignSystem';

export const getStyles = (COLORS: any, SPACING: any, RADIUS: any, FONT_SIZES: any, SHADOWS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.xxl,
        paddingBottom: SPACING.xl,
        justifyContent: 'center',
    },
    orbContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    orbBlue: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        top: -100,
        right: -120,
        backgroundColor: COLORS.background === THEMES.dark.colors.background ? 'rgba(58, 102, 216, 0.15)' : 'rgba(58, 102, 216, 0.08)',
    },
    orbPurple: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        bottom: -50,
        left: -100,
        backgroundColor: COLORS.background === THEMES.dark.colors.background ? 'rgba(58, 102, 216, 0.1)' : 'rgba(58, 102, 216, 0.05)',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    logoGradient: {
        width: 72,
        height: 72,
        borderRadius: RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: COLORS.text,
        textAlign: 'center',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.s,
        marginBottom: SPACING.xxl,
        fontWeight: '500',
    },
    form: {
        marginBottom: SPACING.l,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: SPACING.l,
        marginTop: -SPACING.s,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
    },
    signInButton: {
        marginTop: SPACING.s,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.s,
        marginHorizontal: SPACING.m,
        fontWeight: '500',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.m,
    },
    socialButton: {
        width: 65,
        height: 58,
        paddingHorizontal: 0,
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        ...SHADOWS.sm,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.xl,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.m,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: FONT_SIZES.m,
    },
});
