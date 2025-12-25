import { StyleSheet } from 'react-native';

export const getStyles = (COLORS: any, SPACING: any, RADIUS: any, FONT_SIZES: any, SHADOWS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.background,
    gap: SPACING.l,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  headerAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  headerAvatarText: {
    fontSize: FONT_SIZES.l,
    fontWeight: '700',
    color: '#FFFFFF', // Constant white for profile text
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  greeting: {
    display: 'none', // Hidden
  },
  username: {
    fontSize: FONT_SIZES.m,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  brandingContainer: {
    gap: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoP: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  logoRest: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  firstName: {
    fontSize: FONT_SIZES.m,
    color: COLORS.textMuted,
    marginLeft: SPACING.s,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: RADIUS.m,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusIcon: {
    padding: SPACING.s,
  },
  divider: {
    height: 8,
    backgroundColor: COLORS.surfaceHighlight,
    width: '100%',
    marginVertical: SPACING.s,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Notification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.l,
    paddingBottom: SPACING.m,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.s,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  clearButton: {
    padding: SPACING.s,
    backgroundColor: `${COLORS.accent}15`,
    borderRadius: RADIUS.full,
  },
  notificationList: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.s,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadItem: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.m,
    backgroundColor: COLORS.surfaceHighlight,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: FONT_SIZES.m,
    color: COLORS.text,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  readItem: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  notificationIconBadge: {
    position: 'absolute',
    left: SPACING.m + 28,
    top: SPACING.m + 28,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    zIndex: 1,
  },
  notificationAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationName: {
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationTextRead: {
    color: COLORS.textMuted,
  },
  notificationPostThumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.s,
    marginLeft: SPACING.s,
    backgroundColor: COLORS.surfaceHighlight,
  },
  followBackBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: SPACING.s,
  },
  followBackBtnActive: {
    backgroundColor: COLORS.surfaceHighlight,
  },
  followBackBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followBackBtnTextActive: {
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: SPACING.m,
    right: SPACING.m,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  emptyNotificationsText: {
    fontSize: FONT_SIZES.m,
    color: COLORS.textMuted,
    marginTop: SPACING.m,
  },

  // Section Title
  sectionTitle: {
    fontSize: FONT_SIZES.l,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.l,
    marginBottom: SPACING.m,
  },

  // Quick Actions
  quickActionsContainer: {
    marginBottom: SPACING.l,
  },
  quickActionsScroll: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  quickActionCard: {
    width: 90,
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Stories
  storiesContainer: {
    marginBottom: SPACING.l,
  },
  storiesScroll: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  storyCircleGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  storyCircleInactive: {
    borderWidth: 2,
    borderColor: COLORS.surfaceHighlight,
  },
  storyCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Stats
  statsContainer: {
    marginBottom: SPACING.l,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.m,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xxs,
  },

  // Feed
  feedTitle: {
    marginTop: SPACING.m,
  },
  loadingContainer: {
    paddingHorizontal: SPACING.l,
  },

  // Empty Feed
  emptyFeedContainer: {
    paddingHorizontal: SPACING.l,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
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
    paddingHorizontal: SPACING.l,
    lineHeight: 22,
    marginBottom: SPACING.l,
  },
  emptyButton: {
    width: 220,
  },

  // Feed with Header
  feedContainer: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SPACING.l,
    marginBottom: SPACING.s,
  },
  createPostButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'visible',
  },
  createPostGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden', // Forces the gradient to respect the border radius
    justifyContent: 'center',
    alignItems: 'center',
  },
});