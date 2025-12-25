import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { THEMES, RADIUS, SHADOWS, ANIMATION, BUTTON_STYLES, SPACING } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface DopamineButtonProps {
    onPress: () => void;
    title: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'gradient';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export const DopamineButton: React.FC<DopamineButtonProps> = ({
    onPress,
    title,
    style,
    textStyle,
    variant = 'primary',
    icon,
    iconPosition = 'left',
    disabled = false,
    size = 'medium',
}) => {
    const { currentTheme, isDark } = useTheme();
    const activeColors = currentTheme.colors;
    const activeGradients = currentTheme.gradients;
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: disabled ? 0.5 : 1,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const handlePressIn = () => {
        if (disabled) return;
        scale.value = withSpring(0.96, ANIMATION.springBouncy);
        glowOpacity.value = withSpring(1, ANIMATION.spring);
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1, ANIMATION.springBouncy);
        glowOpacity.value = withSpring(0, ANIMATION.spring);
    };

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    const getHeight = () => {
        switch (size) {
            case 'small': return 42;
            case 'large': return 60;
            default: return BUTTON_STYLES.height;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small': return 14;
            case 'large': return 18;
            default: return 16;
        }
    };

    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return activeColors.primary;
            case 'secondary': return activeColors.secondary;
            case 'outline': return 'transparent';
            case 'glass': return !isDark ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.08)';
            case 'gradient': return 'transparent';
            default: return activeColors.primary;
        }
    };

    const getBorderColor = () => {
        switch (variant) {
            case 'outline': return activeColors.primary;
            case 'glass': return activeColors.border;
            default: return 'transparent';
        }
    };

    const getTextColor = () => {
        if (variant === 'outline') return activeColors.primary;
        if (variant === 'glass' && !isDark) return activeColors.text;
        return activeColors.white;
    };

    const getShadow = () => {
        if (variant === 'glass' || variant === 'outline') return {};
        if (variant === 'gradient' || variant === 'primary') return !isDark ? SHADOWS.md : SHADOWS.primaryGlow;
        if (variant === 'secondary') return SHADOWS.glow(activeColors.secondary);
        return SHADOWS.md;
    };

    const renderContent = () => (
        <View style={styles.contentContainer}>
            {icon && title && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            {title ? (
                <Text style={[
                    styles.text,
                    { color: getTextColor(), fontSize: getFontSize() },
                    textStyle
                ]}>
                    {title}
                </Text>
            ) : null}
            {icon && title && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
            {icon && !title && icon}
        </View>
    );

    if (variant === 'gradient') {
        return (
            <AnimatedTouchable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={disabled}
                style={[animatedStyle, style]}
            >
                <LinearGradient
                    colors={activeGradients.accent as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.container,
                        { height: getHeight() },
                        getShadow(),
                    ]}
                >
                    {renderContent()}
                </LinearGradient>
            </AnimatedTouchable>
        );
    }

    return (
        <AnimatedTouchable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            disabled={disabled}
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: (variant === 'outline' || variant === 'glass') ? 1.5 : 0,
                    height: getHeight(),
                },
                getShadow(),
                animatedStyle,
                style,
            ]}
        >
            {renderContent()}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        overflow: 'hidden',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    iconLeft: {
        marginRight: SPACING.s,
    },
    iconRight: {
        marginLeft: SPACING.s,
    },
});
