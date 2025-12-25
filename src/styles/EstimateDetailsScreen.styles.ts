import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme/DesignSystem';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    headerRight: {
        width: 40,
    },

    // Scroll
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: 180,
    },

    // Status Section
    statusSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    statusIconBg: {
        width: 70,
        height: 70,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    statusTitle: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: SPACING.s,
    },
    statusDate: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },

    // Info Card
    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        padding: SPACING.l,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.m,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.s,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: FONT_SIZES.m,
        color: COLORS.text,
        fontWeight: '500',
    },

    // Section
    section: {
        marginBottom: SPACING.l,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
        color: COLORS.text,
    },

    // Items List
    itemsList: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: FONT_SIZES.m,
        color: COLORS.text,
        fontWeight: '500',
    },
    itemDetails: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    itemTotal: {
        fontSize: FONT_SIZES.m,
        color: COLORS.secondary,
        fontWeight: '700',
    },

    // Totals
    totalsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        padding: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    totalLabel: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textMuted,
    },
    totalValue: {
        fontSize: FONT_SIZES.m,
        color: COLORS.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.m,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    grandTotalLabel: {
        fontSize: FONT_SIZES.l,
        color: COLORS.text,
        fontWeight: '700',
    },
    grandTotalValue: {
        fontSize: FONT_SIZES.xxl,
        color: COLORS.secondary,
        fontWeight: '700',
    },

    // Notes
    notesCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        padding: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    notesText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textMuted,
        lineHeight: 20,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.m,
        paddingBottom: SPACING.xl,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.lg,
    },
    footerRow: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        paddingVertical: SPACING.m,
        borderRadius: RADIUS.m,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionBtnText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
    },
    approveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        paddingVertical: SPACING.m,
        borderRadius: RADIUS.m,
    },
    approveBtnText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
    },
    // Signature
    signatureCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        padding: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    signatureImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#fff',
        borderRadius: RADIUS.s,
    },
    signatureDate: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: SPACING.m,
        textAlign: 'center',
    },
});
