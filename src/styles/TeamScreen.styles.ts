import { StyleSheet, Dimensions } from 'react-native';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';

const { width } = Dimensions.get('window');
const GRID_SPACING = SPACING.s;
const PADDING = SPACING.l;
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - (PADDING * 2) - (GRID_SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

export const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.s,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.m,
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Search
  searchCard: {
    marginHorizontal: SPACING.l,
    marginTop: SPACING.xs,
    marginBottom: SPACING.l,
    padding: 0,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    height: 60,
  },
  atSymbol: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  clearButton: {
    padding: SPACING.xs,
  },

  // TABS
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  // List Section
  listSection: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: PADDING,
    paddingBottom: 100,
  },
  crewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  crewLabel: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight + '20',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: SPACING.s,
  },
  countText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  // Grid Grid Component (The "Floating Windows")
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: GRID_SPACING,
  },
  crewCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.s,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  activeCrewCard: {
    // Border removed for a finer "floating" look as per user request
  },
  crewAvatar: {
    width: ITEM_WIDTH * 0.55,
    height: ITEM_WIDTH * 0.55,
    borderRadius: (ITEM_WIDTH * 0.55) / 2,
    marginBottom: SPACING.s,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  crewName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  crewTag: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },

  // Status indicator on grid card
  gridStatus: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  emptyState: {
    paddingTop: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Chat List Rows
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.m,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  chatLastMsg: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
});