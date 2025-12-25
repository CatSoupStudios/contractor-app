import { StyleSheet, Platform } from 'react-native';
import { THEMES, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../theme/DesignSystem';

export const getStyles = (COLORS: any, SPACING: any, RADIUS: any, FONT_SIZES: any, SHADOWS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: 180,
  },

  // Progress Bar
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.background === THEMES.dark.colors.background ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
  },
  progressBar: {
    height: '100%',
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },

  // Header
  header: {
    marginBottom: SPACING.xl,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  stepIconContainer: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  stepNumber: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.m,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },

  // Form Fields
  fieldContainer: {
    marginBottom: SPACING.l,
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.s,
    fontWeight: '600',
    marginBottom: SPACING.s,
    marginLeft: SPACING.xs,
  },
  selectField: {
    padding: 0,
    paddingHorizontal: SPACING.m,
    height: 60,
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  selectText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.m,
    fontWeight: '500',
  },
  selectPlaceholder: {
    color: COLORS.textDim,
  },

  // Country Field
  countryField: {
    padding: 0,
    paddingHorizontal: SPACING.m,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.m,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.l,
    backgroundColor: COLORS.surface, // Or glass if we want
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  backButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  continueButton: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.m,
    overflow: 'hidden',
  },
  continueButtonFull: {
    marginLeft: 0,
  },
  continueButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.m,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipHint: {
    alignItems: 'center',
    paddingVertical: SPACING.m,
    marginTop: SPACING.xs,
  },
  skipHintText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.s,
    fontWeight: '500',
  },
  skipHintLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Trade Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    paddingBottom: SPACING.xxl,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.l,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalClose: {
    padding: SPACING.xs,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    margin: SPACING.l,
    paddingHorizontal: SPACING.m,
    borderRadius: RADIUS.m,
    height: 52,
    gap: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSearchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.m,
    fontWeight: '500',
  },
  tradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tradeItemText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.m,
    fontWeight: '500',
  },
});
