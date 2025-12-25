import { StyleSheet, Dimensions, Platform } from 'react-native';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');

export const createStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surfaceHighlight,
    },
    name: {
        fontSize: FONT_SIZES.m,
        fontWeight: '700',
        color: COLORS.text,
    },

    // Messages List
    listContent: {
        padding: SPACING.m,
        paddingBottom: SPACING.xl,
    },
    messageWrapper: {
        marginBottom: SPACING.s,
        maxWidth: '80%',
    },
    myMessageWrapper: {
        alignSelf: 'flex-end',
    },
    otherMessageWrapper: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: SPACING.m,
        paddingVertical: 10,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 1,
        elevation: 1,
    },
    myMessageBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: COLORS.white,
    },
    otherMessageText: {
        color: COLORS.text,
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        color: COLORS.textMuted,
    },
    myTimeText: {
        textAlign: 'right',
        color: 'rgba(255, 255, 255, 0.7)',
    },

    // Content Area
    contentArea: {
        flex: 1,
        backgroundColor: COLORS.surfaceHighlight,
    },

    // Input Area
    inputWrapper: {
        paddingTop: 6,
        paddingBottom: 4,
        paddingHorizontal: 12,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 8 : 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 40,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        maxHeight: 100,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.textDim,
        shadowOpacity: 0,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        marginTop: SPACING.m,
        fontSize: 15,
    },

    // Warning Banner (message limit)
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surfaceHighlight,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    warningText: {
        fontSize: 12,
        color: COLORS.textDim,
        textAlign: 'center',
        flex: 1,
    },
});
