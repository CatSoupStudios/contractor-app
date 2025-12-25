import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { auth } from '../../services/firebase';
import { DopamineButton } from '../../components/DopamineButton';
import { AnimatedInput } from '../../components/AnimatedInput';
import { SPACING, RADIUS, FONT_SIZES, ANIMATION, THEMES, SHADOWS } from '../../theme/DesignSystem';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './LoginScreen.styles';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { currentTheme, isDark } = useTheme();
  const { colors: COLORS, gradients: GRADIENTS } = currentTheme;
  const styles = getStyles(COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS);
  // Actually, SHADOWS is static. I'll pass currentTheme.colors to getStyles.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      console.error('Login Error:', error);
      let message = 'An unexpected error occurred';
      if (error.code === 'auth/user-not-found') message = 'No user found with this email';
      else if (error.code === 'auth/wrong-password') message = 'Incorrect password';
      else if (error.code === 'auth/invalid-email') message = 'Invalid email address';

      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Gradient Orbs */}
      <View style={styles.orbContainer}>
        <View style={styles.orbBlue} />
        <View style={styles.orbPurple} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(800).springify()}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue with Projectley</Text>
            </Animated.View>

            {/* Form */}
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
                returnKeyType="next"
              />

              <AnimatedInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showPasswordToggle
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <DopamineButton
                title={loading ? "Signing In..." : "Sign In"}
                variant="gradient"
                onPress={handleLogin}
                disabled={loading}
                style={styles.signInButton}
              />
            </Animated.View>

            {/* Divider */}
            <Animated.View
              entering={FadeInUp.delay(500).duration(600)}
              style={styles.dividerContainer}
            >
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Social Buttons */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(600)}
              style={styles.socialContainer}
            >
              <DopamineButton
                title=""
                variant="outline"
                onPress={() => { }}
                icon={<Ionicons name="logo-google" size={24} color={COLORS.text} />}
                style={styles.socialButton}
              />
              <DopamineButton
                title=""
                variant="outline"
                onPress={() => { }}
                icon={<Ionicons name="logo-apple" size={24} color={COLORS.text} />}
                style={styles.socialButton}
              />
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInUp.delay(700).duration(600)}
              style={styles.footer}
            >
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}