import { StyleSheet, Dimensions } from 'react-native';
import { COLORS_WARM as COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');

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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
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
    },
    saveDraftBtn: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    saveDraftText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
    },

    // ScrollView
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: 200,
    },

    // Client Info Card
    clientCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    clientLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.xs,
    },
    clientName: {
        fontSize: FONT_SIZES.l,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    clientEmail: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textDim,
    },

    // Job Description Card
    descriptionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    descriptionTitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.s,
    },
    descriptionText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.text,
        lineHeight: 20,
    },

    // Section
    section: {
        marginBottom: SPACING.l,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
        color: COLORS.text,
    },
    addItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: RADIUS.full,
    },
    addItemText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
    },
    addItemActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: SPACING.xs,
        flex: 1,
        marginLeft: SPACING.s,
    },

    // Input
    inputGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.s,
    },
    input: {
        backgroundColor: COLORS.surfaceHighlight, // Clean input background
        color: COLORS.text,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        fontSize: FONT_SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputFocused: {
        borderColor: COLORS.primary,
        borderWidth: 1.5,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputRow: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    inputHalf: {
        flex: 1,
    },
    inputThird: {
        flex: 1,
    },

    // Line Items Empty
    emptyItems: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    emptyIcon: {
        width: 50,
        height: 50,
        borderRadius: RADIUS.full,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.s,
    },

    // Totals Section
    totalsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.s,
    },
    totalLabel: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.m,
    },
    totalValue: {
        color: COLORS.text,
        fontSize: FONT_SIZES.m,
        fontWeight: '500',
    },
    totalDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.s,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.m,
    },
    grandTotalLabel: {
        color: COLORS.text,
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
    },
    grandTotalValue: {
        color: COLORS.secondary,
        fontSize: FONT_SIZES.xxl,
        fontWeight: '700',
    },

    // Tax Input Row
    taxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    taxInput: {
        width: 70,
        backgroundColor: COLORS.surfaceHighlight,
        color: COLORS.text,
        paddingHorizontal: SPACING.s,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.xs,
        fontSize: FONT_SIZES.s,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    taxSymbol: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.s,
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
    },
    sendBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: RADIUS.m,
    },
    sendBtnText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.m,
        fontWeight: '700',
    },
    previewBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.m,
        borderRadius: RADIUS.m,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    previewBtnText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.l,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalCloseBtn: {
        padding: SPACING.xs,
    },
    modalInput: {
        backgroundColor: COLORS.surfaceHighlight, // Clean input
        color: COLORS.text,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        fontSize: FONT_SIZES.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.m,
    },
    modalTextArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: SPACING.m,
    },
    modalBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.m,
        borderRadius: RADIUS.m,
        marginTop: SPACING.m,
    },
    modalBtnText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.m,
        fontWeight: '700',
    },

    // Services Picker
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
    },
    servicePrice: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.s,
    },
    serviceAddBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.full,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Checkbox
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        marginTop: SPACING.s,
        marginBottom: SPACING.s,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: RADIUS.xs,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.s,
    },
});
