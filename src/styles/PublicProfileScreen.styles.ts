import { StyleSheet, Dimensions, Platform } from 'react-native';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');
export const modalWidth = screenWidth - 40;
export const CAROUSEL_HEIGHT = 350;

export const createStyles = (COLORS: any, GLASS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 50,
  },

  // Top bar
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 55 : 22,
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  topTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Cover
  coverContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.surfaceHighlight,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // Profile
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    marginTop: -60,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 4,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.primary,
    fontSize: 34,
    fontWeight: '900',
  },

  name: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  specialty: {
    fontSize: FONT_SIZES.m,
    color: COLORS.textMuted,
    marginBottom: SPACING.m,
    fontWeight: '500',
  },

  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  companyText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },
  separator: { color: COLORS.border, marginHorizontal: 6 },

  actionsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 25,
    ...GLASS?.card,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.m },
  actionTextSecondary: { color: COLORS.text, fontWeight: '700', fontSize: FONT_SIZES.m },
  actionTextLocked: { color: COLORS.textDim, fontWeight: '600', fontSize: FONT_SIZES.m },
  actionLocked: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.border,
    opacity: 0.8,
  },
  actionIconOnly: {
    flex: 0,
    width: 50,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    borderRadius: 24,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    width: '100%',
    ...GLASS?.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Portfolio
  portfolioSection: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  portfolioHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  portfolioTitle: {
    fontSize: FONT_SIZES.l,
    fontWeight: '600',
    color: COLORS.text,
  },
  portfolioHint: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33.3333%',
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceHighlight,
  },
  gridPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content type indicators
  projectBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  worksIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },

  emptyPortfolio: {
    marginTop: 20,
    alignItems: 'center',
    opacity: 0.9,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: modalWidth,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...GLASS?.cardElevated,
  },
  carouselFrame: {
    height: CAROUSEL_HEIGHT,
    width: modalWidth,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  carouselEmpty: {
    width: modalWidth,
    height: CAROUSEL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
  },

  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
  },

  modalBody: {
    padding: 14,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 14,
  },
  modalStrong: {
    color: COLORS.text,
    fontWeight: '900',
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  modalMetaText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 25,
    right: 18,
  },
});
