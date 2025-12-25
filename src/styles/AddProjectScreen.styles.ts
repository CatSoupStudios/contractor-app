import { StyleSheet } from 'react-native';

export const getStyles = (theme: any) => {
    const { colors: COLORS, spacing: SPACING, radius: RADIUS, fontSizes: FONT_SIZES, glass: GLASS } = theme;

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.background
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.l,
            paddingTop: SPACING.l,
            paddingBottom: SPACING.m,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            backgroundColor: COLORS.surface,
            ...GLASS?.card,
        },
        title: {
            fontSize: FONT_SIZES.xl,
            fontWeight: '700',
            color: COLORS.text
        },
        closeBtn: {
            padding: SPACING.s,
        },

        body: { flex: 1 },

        scrollContent: {
            padding: SPACING.l,
            paddingBottom: 400, // Extra space to scroll items above keyboard
        },
        subtitle: {
            color: COLORS.textMuted,
            fontSize: FONT_SIZES.m,
            marginBottom: SPACING.xl,
            lineHeight: 24,
        },

        inputGroup: {
            marginBottom: SPACING.l
        },
        label: {
            color: COLORS.text,
            fontSize: FONT_SIZES.s,
            fontWeight: '600',
            marginBottom: SPACING.s,
        },
        input: {
            backgroundColor: COLORS.surfaceHighlight,
            color: COLORS.text,
            padding: SPACING.m,
            borderRadius: RADIUS.m,
            fontSize: FONT_SIZES.m,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        inputFocused: {
            borderColor: COLORS.primary,
            backgroundColor: COLORS.surface,
        },
        textArea: {
            minHeight: 120,
            textAlignVertical: 'top',
        },
        requiredStar: {
            color: COLORS.error || '#EF4444',
        },
        helperText: {
            color: COLORS.textDim,
            fontSize: FONT_SIZES.xs,
            marginTop: SPACING.xs,
        },

        // Row inputs
        inputRow: {
            flexDirection: 'row',
            gap: SPACING.m,
        },
        inputHalf: {
            flex: 1,
        },

        footer: {
            padding: SPACING.l,
            paddingBottom: SPACING.xl,
            backgroundColor: 'transparent',
        },
        createButton: {
            paddingVertical: SPACING.m,
            borderRadius: RADIUS.m,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: SPACING.s,
        },
        createButtonDisabled: {
            opacity: 0.6,
        },
        createButtonText: {
            color: COLORS.white,
            fontSize: FONT_SIZES.l,
            fontWeight: '700'
        },

        // Job Items styles
        jobItemCard: {
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.m,
            padding: SPACING.m,
            marginBottom: SPACING.m,
            borderWidth: 1,
            borderColor: COLORS.border,
            ...GLASS?.card,
        },
        jobItemHeader: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: SPACING.s,
            marginBottom: SPACING.s,
        },
        itemNumberBadge: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 4,
        },
        itemNumberText: {
            color: COLORS.white,
            fontSize: 12,
            fontWeight: '700',
        },
        jobItemInput: {
            flex: 1,
            color: COLORS.text,
            fontSize: FONT_SIZES.m,
            minHeight: 40,
            paddingTop: 5,
        },
        removeItemBtn: {
            padding: 5,
        },
        jobItemActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.m,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: SPACING.s,
        },
        photoActionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 4,
        },
        photoActionText: {
            fontSize: 13,
            color: COLORS.text,
            fontWeight: '500',
        },
        photoPreview: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginLeft: 'auto',
        },
        photoPreviewText: {
            fontSize: 12,
            color: '#10B981',
            fontWeight: '600',
        },

        // Real-time Photo Gallery
        photoGallery: {
            marginTop: SPACING.l,
            padding: SPACING.m,
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.m,
            borderWidth: 1,
            borderColor: COLORS.border,
            ...GLASS?.card,
        },
        photoGalleryHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.m,
        },
        photoGalleryTitle: {
            fontSize: FONT_SIZES.s,
            fontWeight: '700',
            color: COLORS.text,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        photoGalleryCount: {
            fontSize: 12,
            color: COLORS.textMuted,
            fontWeight: '600',
        },
        photoScroll: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.s,
            paddingVertical: SPACING.xs,
        },
        photoThumb: {
            width: 80,
            height: 80,
            borderRadius: RADIUS.s,
            marginRight: SPACING.s,
            overflow: 'hidden',
            backgroundColor: COLORS.surfaceHighlight,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        photoThumbImg: {
            width: '100%',
            height: '100%',
        },
        photoThumbEmpty: {
            width: 80,
            height: 80,
            borderRadius: RADIUS.s,
            marginRight: SPACING.s,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
};
