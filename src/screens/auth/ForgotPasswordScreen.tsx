import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { auth } from '../../services/firebase';
import { DopamineButton } from '../../components/DopamineButton';
import { AnimatedInput } from '../../components/AnimatedInput';
import { SPACING, RADIUS, FONT_SIZES, THEMES, SHADOWS } from '../../theme/DesignSystem';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './LoginScreen.styles'; // Reusing Login styles for consistency

export default function ForgotPasswordScreen() {
    const navigation = useNavigation<any>();
    const { currentTheme, isDark } = useTheme();
    const { colors: COLORS } = currentTheme;
    const styles = getStyles(COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS);

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            console.error('Reset Password Error:', error);
            let message = 'An unexpected error occurred';
            if (error.code === 'auth/user-not-found') message = 'No user found with this email';
            else if (error.code === 'auth/invalid-email') message = 'Invalid email address';
            else if (error.code === 'auth/too-many-requests') message = 'Too many requests. Please try again later';

            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ position: 'absolute', top: 10, left: 0, zIndex: 10, padding: 10 }}
                        >
                            <Ionicons name="arrow-back" size={28} color={COLORS.text} />
                        </TouchableOpacity>

                        <View style={{ marginTop: 60 }}>
                            <Animated.View entering={FadeInDown.delay(100).duration(800).springify()}>
                                <Text style={styles.title}>{sent ? "Check your Email" : "Reset Password"}</Text>
                                <Text style={styles.subtitle}>
                                    {sent
                                        ? `We've sent a password reset link to ${email}`
                                        : "Enter your email address and we'll send you a link to reset your password."
                                    }
                                </Text>
                            </Animated.View>

                            {!sent ? (
                                <Animated.View
                                    entering={FadeInDown.delay(300).duration(800).springify()}
                                    style={styles.form}
                                >
                                    <AnimatedInput
                                        label="Email Address"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={email}
                                        onChangeText={setEmail}
                                        returnKeyType="done"
                                        onSubmitEditing={handleResetPassword}
                                    />

                                    <DopamineButton
                                        title={loading ? "Sending..." : "Send Reset Link"}
                                        variant="gradient"
                                        onPress={handleResetPassword}
                                        disabled={loading}
                                        style={{ marginTop: SPACING.m }}
                                    />
                                </Animated.View>
                            ) : (
                                <Animated.View
                                    entering={FadeInDown.delay(300).duration(800).springify()}
                                    style={{ marginTop: SPACING.xl }}
                                >
                                    <DopamineButton
                                        title="Back to Login"
                                        variant="outline"
                                        onPress={() => navigation.navigate('Login')}
                                        style={styles.signInButton}
                                    />
                                </Animated.View>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}