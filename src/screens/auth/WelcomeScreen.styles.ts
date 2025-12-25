import { StyleSheet } from 'react-native';

export const getStyles = (COLORS: any, SPACING: any, RADIUS: any, FONT_SIZES: any, SHADOWS: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    background: { flex: 1, justifyContent: 'flex-end' },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: SPACING.l,
        paddingBottom: 60
    },
    content: { alignItems: 'center' },
    title: {
        fontSize: 52,
        fontWeight: '900',
        color: '#fff',
        marginBottom: SPACING.s,
        textAlign: 'center',
        letterSpacing: -1.5,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: FONT_SIZES.l,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 50,
        lineHeight: 28,
        fontWeight: '500',
        paddingHorizontal: SPACING.m,
    },
    buttonContainer: { width: '100%', gap: SPACING.m },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 20,
        borderRadius: RADIUS.l,
        alignItems: 'center',
        width: '100%',
        ...SHADOWS.lg,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingVertical: 18,
        borderRadius: RADIUS.l,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    }
});
