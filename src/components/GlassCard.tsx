import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { RADIUS, ANIMATION } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'flat';
    pressable?: boolean;
    onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    variant = 'default',
    pressable = false,
    onPress,
}) => {
    const { currentTheme } = useTheme();
    const { colors: COLORS, glass: GLASS } = currentTheme;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (!pressable) return;
        scale.value = withSpring(0.98, ANIMATION.springBouncy);
    };

    const handlePressOut = () => {
        if (!pressable) return;
        scale.value = withSpring(1, ANIMATION.springBouncy);
    };

    const getGlassStyle = () => {
        switch (variant) {
            case 'elevated': return GLASS.cardElevated;
            case 'flat': return {
                backgroundColor: COLORS.surfaceHighlight,
                borderColor: COLORS.border,
                borderWidth: 1,
            };
            default: return GLASS.card;
        }
    };

    if (pressable) {
        return (
            <AnimatedPressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.card, getGlassStyle(), animatedStyle, style]}
            >
                {children}
            </AnimatedPressable>
        );
    }

    return (
        <View style={[styles.card, getGlassStyle(), style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.l,
        padding: 20,
        overflow: 'hidden',
    },
});
