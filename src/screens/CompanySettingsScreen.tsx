import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { auth } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';

export default function CompanySettingsScreen() {
    const { currentTheme: theme, isDark } = useTheme();
    const COLORS = theme.colors;
    const GRADIENTS = theme.gradients;

    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const navigation = useNavigation<any>();
    const db = getFirestore();
    const user = auth.currentUser;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Company fields
    const [companyLogo, setCompanyLogo] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [contractorLicense, setContractorLicense] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [paymentInstructions, setPaymentInstructions] = useState('');

    useEffect(() => {
        loadCompanyData();
    }, []);

    const loadCompanyData = async () => {
        if (!user) return;
        try {
            const profileRef = doc(db, 'profiles', user.uid);
            const snap = await getDoc(profileRef);
            if (snap.exists()) {
                const data = snap.data();
                setCompanyLogo(data.companyLogo || '');
                setCompanyName(data.company_name || data.companyName || '');
                setCompanyPhone(data.companyPhone || data.phone || '');
                setCompanyEmail(data.companyEmail || user.email || '');
                setCompanyAddress(data.companyAddress || '');
                setContractorLicense(data.contractorLicense || '');
                setCompanyWebsite(data.companyWebsite || '');
                setPaymentInstructions(data.paymentInstructions || '');
            }
        } catch (e) {
            console.log('Error loading company data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePickLogo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permission Denied', 'Gallery access is needed.');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setUploadingLogo(true);
            try {
                const url = await uploadToCloudinary(result.assets[0].uri);
                if (url) {
                    setCompanyLogo(url);
                }
            } catch (e) {
                Alert.alert('Error', 'Could not upload logo.');
            } finally {
                setUploadingLogo(false);
            }
        }
    };

    const handleSave = async () => {
        if (!user) return;

        if (!companyName.trim()) {
            return Alert.alert('Required', 'Please enter your company name.');
        }

        setSaving(true);
        try {
            const profileRef = doc(db, 'profiles', user.uid);
            await updateDoc(profileRef, {
                companyLogo,
                companyName: companyName.trim(),
                company_name: companyName.trim(), // Keep both for compatibility
                companyPhone: companyPhone.trim(),
                companyEmail: companyEmail.trim(),
                companyAddress: companyAddress.trim(),
                contractorLicense: contractorLicense.trim(),
                companyWebsite: companyWebsite.trim(),
                paymentInstructions: paymentInstructions.trim(),
            });

            Alert.alert('Saved!', 'Your company information has been updated.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            console.log('Error saving company data:', e);
            Alert.alert('Error', 'Could not save company information.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Company Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Logo Section */}
                        <Animated.View entering={FadeInDown.delay(100).springify()}>
                            <View style={styles.logoSection}>
                                <TouchableOpacity
                                    style={styles.logoContainer}
                                    onPress={handlePickLogo}
                                    disabled={uploadingLogo}
                                >
                                    {uploadingLogo ? (
                                        <ActivityIndicator size="large" color={COLORS.primary} />
                                    ) : companyLogo ? (
                                        <Image source={{ uri: companyLogo }} style={styles.logoImage} contentFit="cover" />
                                    ) : (
                                        <View style={styles.logoPlaceholder}>
                                            <Ionicons name="business" size={40} color={COLORS.textDim} />
                                            <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                                        </View>
                                    )}
                                    <View style={styles.logoEditBadge}>
                                        <Ionicons name="camera" size={14} color={COLORS.white} />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.logoHint}>Tap to upload your company logo</Text>
                            </View>
                        </Animated.View>

                        {/* Company Info */}
                        <Animated.View entering={FadeInDown.delay(200).springify()}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Company Information</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Company Name *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your Company LLC"
                                        placeholderTextColor={COLORS.textDim}
                                        value={companyName}
                                        onChangeText={setCompanyName}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Contractor License #</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. CSLB #123456"
                                        placeholderTextColor={COLORS.textDim}
                                        value={contractorLicense}
                                        onChangeText={setContractorLicense}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Business Phone</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="(555) 123-4567"
                                        placeholderTextColor={COLORS.textDim}
                                        value={companyPhone}
                                        onChangeText={setCompanyPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Business Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="contact@yourcompany.com"
                                        placeholderTextColor={COLORS.textDim}
                                        value={companyEmail}
                                        onChangeText={setCompanyEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Business Address</Text>
                                    <TextInput
                                        style={[styles.input, { height: 70 }]}
                                        placeholder="123 Main St, City, State 12345"
                                        placeholderTextColor={COLORS.textDim}
                                        value={companyAddress}
                                        onChangeText={setCompanyAddress}
                                        multiline
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Website (optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="www.yourcompany.com"
                                        placeholderTextColor={COLORS.textDim}
                                        value={companyWebsite}
                                        onChangeText={setCompanyWebsite}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                        </Animated.View>

                        {/* Payment Instructions */}
                        <Animated.View entering={FadeInDown.delay(300).springify()}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Payment Instructions</Text>
                                <Text style={styles.sectionHint}>This will appear on your estimates</Text>

                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="e.g. Payment due within 30 days. Checks payable to Your Company LLC. Zelle: your@email.com"
                                    placeholderTextColor={COLORS.textDim}
                                    value={paymentInstructions}
                                    onChangeText={setPaymentInstructions}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </Animated.View>

                        {/* Save Button */}
                        <Animated.View entering={FadeInDown.delay(400).springify()}>
                            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={GRADIENTS.primary as [string, string]}
                                    style={styles.saveBtn}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                                            <Text style={styles.saveBtnText}>Save Company Info</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const createStyles = (COLORS: any) => StyleSheet.create({
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
        color: COLORS.text,
    },
    scrollContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 100,
    },

    // Logo Section
    logoSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: RADIUS.l,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    logoPlaceholder: {
        alignItems: 'center',
        gap: SPACING.xs,
    },
    logoPlaceholderText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textDim,
    },
    logoEditBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoHint: {
        marginTop: SPACING.s,
        fontSize: FONT_SIZES.xs,
        color: COLORS.textDim,
    },

    // Section
    section: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    sectionHint: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textDim,
        marginBottom: SPACING.m,
    },

    // Inputs
    inputGroup: {
        marginBottom: SPACING.m,
    },
    inputLabel: {
        fontSize: FONT_SIZES.s,
        fontWeight: '500',
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        fontSize: FONT_SIZES.m,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },

    // Save Button
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        paddingVertical: SPACING.m,
        borderRadius: RADIUS.m,
        marginTop: SPACING.m,
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
    },
});
