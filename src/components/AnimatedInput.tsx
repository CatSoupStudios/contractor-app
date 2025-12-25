import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, Pressable, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEMES, SPACING, RADIUS, ANIMATION, FONT_SIZES } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';

interface AnimatedInputProps extends TextInputProps {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    error?: string;
    containerStyle?: ViewStyle;
    showPasswordToggle?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
    label,
    icon,
    error,
    containerStyle,
    showPasswordToggle = false,
    value,
    onFocus,
    onBlur,
    secureTextEntry,
    ...props
}) => {
    const { currentTheme, isDark } = useTheme();
    const activeColors = currentTheme.colors;
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const inputRef = useRef<TextInput>(null);

    const focusAnim = useSharedValue(0);
    const hasValue = value && value.length > 0;

    useEffect(() => {
        focusAnim.value = withSpring(isFocused || hasValue ? 1 : 0, ANIMATION.spring);
    }, [isFocused, hasValue]);

    const labelStyle = useAnimatedStyle(() => {
        return {
            top: interpolate(focusAnim.value, [0, 1], [18, -10]),
            fontSize: interpolate(focusAnim.value, [0, 1], [16, 12]),
            color: interpolateColor(
                focusAnim.value,
                [0, 1],
                [activeColors.textDim, isFocused ? activeColors.primary : activeColors.textMuted]
            ),
        };
    });

    const containerAnimStyle = useAnimatedStyle(() => {
        const borderColor = error
            ? activeColors.accent
            : isFocused
                ? activeColors.primary
                : activeColors.border;

        return {
            borderColor,
            borderWidth: isFocused ? 1.5 : 1,
        };
    });

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const handleContainerPress = () => {
        inputRef.current?.focus();
    };

    const styles = getStyles(activeColors, SPACING, RADIUS, FONT_SIZES);

    return (
        <View style={[styles.wrapper, containerStyle]}>
            <Pressable onPress={handleContainerPress}>
                <AnimatedView style={[
                    styles.container,
                    containerAnimStyle
                ]}>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={isFocused ? activeColors.primary : activeColors.textMuted}
                            style={styles.icon}
                        />
                    )}

                    <View style={styles.inputWrapper}>
                        <AnimatedText style={[
                            styles.floatingLabel,
                            labelStyle
                        ]}>
                            {label}
                        </AnimatedText>
                        <TextInput
                            ref={inputRef}
                            style={[styles.input, { color: activeColors.text, paddingTop: Platform.OS === 'ios' ? 10 : 0 }]}
                            value={value}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholderTextColor={activeColors.textDim}
                            selectionColor={activeColors.primary}
                            secureTextEntry={isSecure}
                            {...props}
                        />
                    </View>

                    {showPasswordToggle && (
                        <Pressable
                            onPress={() => setIsSecure(!isSecure)}
                            style={styles.toggleButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={isSecure ? "eye-outline" : "eye-off-outline"}
                                size={22}
                                color={activeColors.textMuted}
                            />
                        </Pressable>
                    )}
                </AnimatedView>
            </Pressable>

            {error && (
                <Text style={[styles.errorText, { color: activeColors.accent }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const getStyles = (COLORS: any, SPACING: any, RADIUS: any, FONT_SIZES: any) => StyleSheet.create({
    wrapper: {
        marginBottom: SPACING.l,
    },
    container: {
        borderRadius: RADIUS.m,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        borderWidth: 1,
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
    },
    icon: {
        marginRight: SPACING.s,
    },
    inputWrapper: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        position: 'relative',
    },
    floatingLabel: {
        position: 'absolute',
        left: 0,
        paddingHorizontal: 4,
        zIndex: 1,
        backgroundColor: COLORS.surface,
    },
    input: {
        flex: 1,
        fontSize: FONT_SIZES.m,
    },
    toggleButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.s,
    },
    errorText: {
        fontSize: FONT_SIZES.xs,
        marginTop: SPACING.xs,
        marginLeft: SPACING.xs,
    },
});
