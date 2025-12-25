import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  Alert,
  Modal,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../../services/firebase';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { SPACING, RADIUS, FONT_SIZES, ANIMATION, THEMES, SHADOWS } from '../../theme/DesignSystem';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './SignUpScreen.styles';
import { AnimatedInput } from '../../components/AnimatedInput';
import { DopamineButton } from '../../components/DopamineButton';

const COMMON_TRADES = [
  'General Contractor', 'Electrician', 'Plumber', 'Carpenter', 'Painter',
  'HVAC Technician', 'Roofer', 'Masonry', 'Landscaping', 'Flooring',
  'Tiling', 'Drywaller', 'Welder', 'Glazier', 'Handyman', 'Remodeler',
  'Concrete', 'Framing', 'Insulation', 'Cabinet Maker', 'Solar Installer',
  'Demolition', 'Elevator Mechanic', 'Fence Installer', 'Pool Builder',
  'Ironworker', 'Siding Installer', 'Stucco Mason', 'Acoustics Specialist',
  'Fire Sprinkler Installer', 'Heavy Equipment Operator', 'Site Supervisor',
  'Project Manager', 'Estimator', 'Architect', 'Interior Designer',
  'Septic Specialist', 'Wallpaper Installer', 'Paving', 'Appliance Installer'
];

export default function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { currentTheme, isDark } = useTheme();
  const { colors: COLORS, gradients: GRADIENTS } = currentTheme;
  const styles = getStyles(COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS);

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeSearch, setTradeSearch] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    specialty: '',
    country: 'United States',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.substring(0, 10);
    let formatted = match;
    if (match.length > 6) {
      formatted = `${match.slice(0, 3)}-${match.slice(3, 6)}-${match.slice(6)}`;
    } else if (match.length > 3) {
      formatted = `${match.slice(0, 3)}-${match.slice(3)}`;
    }
    updateForm('phone', formatted);
  };

  const filteredTrades = useMemo(() => {
    if (!tradeSearch) return COMMON_TRADES;
    return COMMON_TRADES.filter(t => t.toLowerCase().includes(tradeSearch.toLowerCase()));
  }, [tradeSearch]);

  const handleSelectTrade = (trade: string) => {
    updateForm('specialty', trade);
    setShowTradeModal(false);
    setTradeSearch('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
    if (form.password.length < 8) {
      return Alert.alert('Weak Password', 'Password should be at least 8 characters.');
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      await updateProfile(user, { displayName: fullName });

      // Generate unique 6-digit userTag
      const userTag = Math.floor(100000 + Math.random() * 900000).toString();

      // Write to 'profiles' collection (not 'users') with correct field names
      await setDoc(doc(db, "profiles", user.uid), {
        uid: user.uid,
        full_name: fullName,
        company_name: form.companyName,
        specialty: form.specialty,
        phone: form.phone,
        email: form.email,
        userTag: userTag,
        photoUrl: null,
        coverUrl: null,
        followersCount: 0,
        followingCount: 0,
        publicProjectsCount: 0,
        country: 'United States',
        createdAt: serverTimestamp(),
        onboardingComplete: true,
        subscription: 'free'
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.log('SignUp Error:', error.code);
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!form.firstName || !form.lastName)) return Alert.alert('Missing Info', 'Please enter both your First and Last name.');
    if (step === 2 && !form.companyName) return Alert.alert('Missing Info', 'Company name is required.');
    if (step === 2 && !form.specialty) return Alert.alert('Missing Info', 'Please select a trade.');
    if (step === 3 && form.phone.length < 12) return Alert.alert('Invalid Phone', 'Please enter a valid 10-digit number.');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(step + 1);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View entering={FadeInDown.springify()} key="step1">
            <AnimatedInput
              label="First Name"
              icon="person-outline"
              value={form.firstName}
              onChangeText={(t) => updateForm('firstName', t)}
              autoFocus
              returnKeyType="next"
            />
            <AnimatedInput
              label="Last Name"
              icon="person-outline"
              value={form.lastName}
              onChangeText={(t) => updateForm('lastName', t)}
              returnKeyType="done"
            />
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View entering={FadeInDown.springify()} key="step2">
            <AnimatedInput
              label="Company Name"
              icon="business-outline"
              value={form.companyName}
              onChangeText={(t) => updateForm('companyName', t)}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Main Trade</Text>
              <TouchableOpacity onPress={() => setShowTradeModal(true)} activeOpacity={0.7} style={styles.selectField}>
                <View style={styles.selectContent}>
                  <Ionicons name="construct-outline" size={20} color={COLORS.textMuted} />
                  <Text style={[styles.selectText, !form.specialty && styles.selectPlaceholder]}>
                    {form.specialty || "Select your trade..."}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View entering={FadeInDown.springify()} key="step3">
            <AnimatedInput
              label="Phone Number"
              icon="call-outline"
              value={form.phone}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="XXX-XXX-XXXX"
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Country</Text>
              <View style={styles.countryField}>
                <Text style={styles.countryFlag}>🇺🇸</Text>
                <Text style={styles.countryText}>United States (+1)</Text>
                <Ionicons name="lock-closed-outline" size={16} color={COLORS.textDim} />
              </View>
            </View>
          </Animated.View>
        );
      case 4:
        return (
          <Animated.View entering={FadeInDown.springify()} key="step4">
            <AnimatedInput
              label="Email Address"
              icon="mail-outline"
              value={form.email}
              onChangeText={(t) => updateForm('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AnimatedInput
              label="Password"
              icon="lock-closed-outline"
              value={form.password}
              onChangeText={(t) => updateForm('password', t)}
              secureTextEntry
              showPasswordToggle
            />
            <AnimatedInput
              label="Confirm Password"
              icon="shield-checkmark-outline"
              value={form.confirmPassword}
              onChangeText={(t) => updateForm('confirmPassword', t)}
              secureTextEntry
              showPasswordToggle
            />
          </Animated.View>
        );
      default: return null;
    }
  };

  const getStepHeader = () => {
    switch (step) {
      case 1: return { title: "Create Account", sub: "Start your journey with Projectley", icon: "person" };
      case 2: return { title: "Your Expertise", sub: "Let us know what you do best", icon: "hammer" };
      case 3: return { title: "Company Details", sub: "Tell us about your business", icon: "business" };
      case 4: return { title: "Secure Account", sub: "Last step! Protect your data", icon: "lock-closed" };
      default: return { title: "", sub: "", icon: "checkmark" };
    }
  };

  const headerInfo = getStepHeader();
  const progressPercent = (step / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.background }]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* TRADE MODAL */}
        <Modal visible={showTradeModal} animationType="slide" transparent={true} onRequestClose={() => setShowTradeModal(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeIn.duration(200)} style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Trade</Text>
                <TouchableOpacity onPress={() => setShowTradeModal(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearch}>
                <Ionicons name="search" size={20} color={COLORS.textDim} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search trades..."
                  placeholderTextColor={COLORS.textDim}
                  value={tradeSearch}
                  onChangeText={setTradeSearch}
                />
              </View>

              <FlatList
                data={filteredTrades}
                keyExtractor={i => i}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSelectTrade(item)} style={styles.tradeItem}>
                    <Text style={styles.tradeItemText}>{item}</Text>
                    {form.specialty === item && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          </View>
        </Modal>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          {/* PROGRESS BAR */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]}>
              <LinearGradient
                colors={GRADIENTS.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* HEADER */}
            <Animated.View entering={FadeInDown.springify()} style={styles.header}>
              <View style={styles.stepIndicator}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name={(headerInfo.icon + '-outline') as any} size={28} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.stepNumber}>Step {step} of {totalSteps}</Text>
                  <Text style={styles.title}>{headerInfo.title}</Text>
                </View>
              </View>

              <Text style={styles.subtitle}>{headerInfo.sub}</Text>
            </Animated.View>

            {/* FORM CONTENT */}
            {renderStep()}
          </ScrollView>

          {/* BOTTOM ACTION BAR */}
          <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
            <View style={styles.buttonRow}>
              {/* Back Button - Only shown if not on step 1 */}
              {step > 1 && (
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backButtonCircle}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
              )}

              {/* Main Action Button */}
              <DopamineButton
                onPress={step === totalSteps ? handleSubmit : handleNext}
                title={step === totalSteps ? (loading ? "Creating..." : "Create Account") : "Continue"}
                variant="gradient"
                style={styles.continueButton}
                disabled={loading}
              />
            </View>

            {/* Skip hint for step 1 */}
            {step === 1 && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.skipHint}>
                <Text style={styles.skipHintText}>Already have an account? <Text style={styles.skipHintLink}>Sign In</Text></Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}