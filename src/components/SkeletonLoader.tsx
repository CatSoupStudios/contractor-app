import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    cancelAnimation,
    Easing
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}) => {
    const { currentTheme } = useTheme();
    const { colors: COLORS } = currentTheme;
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true // reverse
        );
        return () => {
            cancelAnimation(opacity);
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                { backgroundColor: COLORS.surfaceHighlight },
                {
                    width: width as any,
                    height,
                    borderRadius
                },
                animatedStyle,
                style
            ]}
        />
    );
};

