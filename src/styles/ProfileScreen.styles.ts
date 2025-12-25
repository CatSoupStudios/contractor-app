import { StyleSheet, Dimensions } from 'react-native';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');
export const modalWidth = screenWidth - 40;
export const CAROUSEL_HEIGHT = 350;

export const createStyles = (COLORS: any, GLASS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
  coverEditButton: {
    position: 'absolute',
    right: SPACING.m,
    bottom: SPACING.m,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xs,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginTop: -60,
    paddingHorizontal: SPACING.l,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  avatarLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
  },
  avatarEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 4,
  },
  avatarEditGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  bioText: {
    fontSize: FONT_SIZES.m,
    color: COLORS.textMuted,
    marginBottom: SPACING.m,
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    borderRadius: 24,
    marginBottom: SPACING.xl,
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
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  editButton: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT_SIZES.m,
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...GLASS?.card,
  },

  // Portfolio
  portfolioSection: {
    paddingHorizontal: SPACING.l,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  portfolioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  portfolioTitle: {
    fontSize: FONT_SIZES.l,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Content Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.l,
    gap: SPACING.s,
  },
  contentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contentTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  contentTabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: (screenWidth - SPACING.l * 2 - 4) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surfaceHighlight,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multipleIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  emptyPortfolio: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.m,
    marginBottom: SPACING.m,
  },
  addProjectButton: {
    width: 160,
  },

  // Modal - Premium Dopamine Style
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
  modalCloseBtn: {
    position: 'absolute',
    top: SPACING.m,
    right: SPACING.m,
    zIndex: 10,
  },
  modalCloseBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalImageContainer: {
    height: CAROUSEL_HEIGHT,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  modalImagePlaceholder: {
    width: '100%',
    height: CAROUSEL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
  },
  modalImagePlaceholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesText: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.s,
    marginTop: SPACING.s,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: SPACING.m,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  imageCountBadge: {
    position: 'absolute',
    top: SPACING.m,
    left: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: RADIUS.m,
  },
  imageCountText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  modalBody: {
    padding: SPACING.l,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  modalTitleAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: SPACING.s,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalInfoText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.s,
  },
  modalInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.m,
  },
  modalViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.m,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  modalViewBtnText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.m,
    fontWeight: '600',
  },

  // Company Settings Button
  companySettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  companySettingsBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  companySettingsBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.s,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companySettingsBtnText: {
    gap: 2,
  },
  companySettingsBtnTitle: {
    fontSize: FONT_SIZES.m,
    fontWeight: '600',
    color: COLORS.text,
  },
  companySettingsBtnHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDim,
  },
});