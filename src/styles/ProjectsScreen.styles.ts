import { StyleSheet, Dimensions, Platform } from 'react-native';

export const getStyles = (theme: any) => {
    const { COLORS, SPACING, RADIUS, FONT_SIZES, GLASS } = theme;
    const { width, height } = Dimensions.get('window');

    const CARD_HEIGHT = theme.CARD_HEIGHT || height * 0.55;
    const GRID_SPACING = theme.GRID_SPACING || SPACING.s;
    const GRID_PADDING = theme.GRID_PADDING || SPACING.m;
    const GRID_ITEM_WIDTH = theme.GRID_ITEM_WIDTH || (width - (GRID_PADDING * 2) - GRID_SPACING) / 2;
    const GRID_ITEM_HEIGHT = theme.GRID_ITEM_HEIGHT || GRID_ITEM_WIDTH * 1.3;

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.background,
        },
        safeArea: {
            flex: 1,
        },
        loadingContainer: {
            justifyContent: 'center',
            alignItems: 'center',
        },

        // Header
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.l,
            paddingVertical: SPACING.m,
        },
        statsBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: RADIUS.full,
            gap: 6,
            ...GLASS?.card,
        },
        statsText: {
            fontSize: FONT_SIZES.s,
            fontWeight: '600',
            color: COLORS.text,
        },
        headerTitle: {
            fontSize: FONT_SIZES.xl,
            fontWeight: '700',
            color: COLORS.text,
        },
        bellButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            ...GLASS?.card,
        },

        // Card Area
        cardArea: {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: SPACING.xl,
        },
        projectCardShadow: {
            width: width - SPACING.l * 2,
            height: CARD_HEIGHT,
            borderRadius: RADIUS.xl,
            ...GLASS?.cardElevated,
            backgroundColor: COLORS.surface,
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.30,
            shadowRadius: 4.65,
            elevation: 8,
        },
        projectCardContent: {
            flex: 1,
            borderRadius: RADIUS.xl,
            overflow: 'hidden',
        },
        gridItemContainer: {
            width: GRID_ITEM_WIDTH,
        },
        gridProjectCardShadow: {
            width: '100%',
            height: GRID_ITEM_HEIGHT,
            borderRadius: RADIUS.l,
            ...GLASS?.cardElevated,
            backgroundColor: COLORS.surface,
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        gridProjectCardContent: {
            flex: 1,
            borderRadius: RADIUS.l,
            overflow: 'hidden',
        },
        cardImageContainer: {
            flex: 1,
            position: 'relative',
        },
        cardImage: {
            width: '100%',
            height: '100%',
        },
        cardImagePlaceholder: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cardOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
        },
        statusBadge: {
            position: 'absolute',
            top: SPACING.m,
            left: SPACING.m,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: RADIUS.full,
            gap: 6,
        },
        statusDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#4ADE80',
        },
        statusText: {
            fontSize: 11,
            fontWeight: '600',
            color: COLORS.white,
        },
        cardInfo: {
            position: 'absolute',
            bottom: SPACING.m,
            left: SPACING.m,
            right: SPACING.m,
        },
        projectName: {
            fontSize: FONT_SIZES.xxl,
            fontWeight: '700',
            color: COLORS.white,
            marginBottom: 4,
        },
        projectClient: {
            fontSize: FONT_SIZES.m,
            color: 'rgba(255,255,255,0.8)',
        },
        imageCount: {
            position: 'absolute',
            top: SPACING.m,
            right: SPACING.m,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: RADIUS.full,
            gap: 4,
        },
        imageCountText: {
            fontSize: 12,
            fontWeight: '600',
            color: COLORS.white,
        },
        cardFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.m,
            backgroundColor: COLORS.surface,
        },
        cardDate: {
            fontSize: FONT_SIZES.s,
            color: COLORS.textMuted,
        },
        cardPagination: {
            backgroundColor: COLORS.surfaceHighlight,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: RADIUS.s,
        },
        paginationText: {
            fontSize: 12,
            fontWeight: '600',
            color: COLORS.textMuted,
        },
        swipeHint: {
            position: 'absolute',
            top: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: 6,
        },
        swipeHintText: {
            fontSize: FONT_SIZES.xs,
            color: COLORS.textMuted,
        },

        // Action Buttons
        actionsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: SPACING.m,
            paddingVertical: SPACING.l,
            marginBottom: SPACING.m,
        },
        actionButton: {
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
        },
        actionButtonSecondary: {
            ...GLASS?.card,
        },
        actionButtonMain: {
            width: 72,
            height: 72,
            borderRadius: 36,
            overflow: 'hidden',
        },
        actionButtonMainGradient: {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },

        // View Button
        viewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginHorizontal: SPACING.xl,
            marginBottom: SPACING.l,
            paddingVertical: SPACING.m,
            borderRadius: RADIUS.m,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        viewButtonText: {
            fontSize: FONT_SIZES.m,
            fontWeight: '600',
            color: COLORS.primary,
        },

        // Empty State
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyIconCircle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: COLORS.surfaceHighlight,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: SPACING.l,
        },
        emptyTitle: {
            fontSize: FONT_SIZES.xl,
            fontWeight: '700',
            color: COLORS.text,
            marginBottom: SPACING.s,
        },
        emptySubtitle: {
            fontSize: FONT_SIZES.m,
            color: COLORS.textMuted,
            textAlign: 'center',
            paddingHorizontal: SPACING.xl,
        },

        // Clients Modal
        clientModalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        clientModalContainer: {
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            padding: SPACING.l,
            paddingBottom: SPACING.xxl,
            height: '90%',
        },
        clientModalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.l,
        },
        clientModalTitle: {
            fontSize: FONT_SIZES.xl,
            fontWeight: '700',
            color: COLORS.text,
        },
        clientsEmpty: {
            alignItems: 'center',
            paddingVertical: SPACING.xl,
        },
        clientsEmptyText: {
            color: COLORS.textMuted,
            fontSize: FONT_SIZES.m,
            marginTop: SPACING.m,
        },
        clientItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.m,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
        },
        clientAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.m,
        },
        clientAvatarText: {
            color: COLORS.white,
            fontSize: FONT_SIZES.m,
            fontWeight: '700',
        },
        clientInfo: {
            flex: 1,
        },
        clientName: {
            fontSize: FONT_SIZES.m,
            fontWeight: '600',
            color: COLORS.text,
        },
        clientPhone: {
            fontSize: FONT_SIZES.s,
            color: COLORS.textMuted,
            marginTop: 2,
        },
        clientActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.xs,
        },
        clientActionBtn: {
            padding: SPACING.s,
            borderRadius: RADIUS.s,
            backgroundColor: COLORS.surfaceHighlight,
        },
        addClientBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.s,
            paddingVertical: SPACING.m,
            borderRadius: RADIUS.m,
            marginTop: SPACING.l,
        },
        addClientBtnText: {
            color: COLORS.white,
            fontSize: FONT_SIZES.m,
            fontWeight: '700',
        },
    });
};
