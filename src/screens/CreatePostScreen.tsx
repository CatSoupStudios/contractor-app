import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import {
    getFirestore, collection, addDoc, serverTimestamp, doc, getDoc
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import * as Haptics from 'expo-haptics';

import { THEMES, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { DopamineButton } from '../components/DopamineButton';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - SPACING.l * 2 - SPACING.s * 3) / 4;
const MAX_IMAGES = 4;

export default function CreatePostScreen() {
    const navigation = useNavigation<any>();
    const db = getFirestore();
    const user = auth.currentUser;
    const { currentTheme, isDark } = useTheme();
    const { colors: COLORS, gradients: GRADIENTS, glass: GLASS } = currentTheme;
    const styles = getStyles(COLORS, GRADIENTS, GLASS, SPACING, RADIUS, FONT_SIZES);

    const [images, setImages] = useState<string[]>([]);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [visibility, setVisibility] = useState<'public' | 'followers'>('public');
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (user) {
            getDoc(doc(db, "profiles", user.uid)).then(docSnap => {
                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                }
            });
        }
    }, [user]);

    const pickImages = async () => {
        if (images.length >= MAX_IMAGES) {
            return Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES} images per post.`);
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permission Denied', 'We need access to your gallery.');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - images.length,
            quality: 0.7,
        });

        if (!result.canceled && result.assets) {
            const newImages = result.assets.map(a => a.uri);
            setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePost = async () => {
        if (images.length === 0) {
            return Alert.alert('Add Images', 'Please add at least one image to your post.');
        }

        if (!user) return;

        setUploading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Get user profile
            const profileRef = doc(db, "profiles", user.uid);
            const profileSnap = await getDoc(profileRef);
            const profileData = profileSnap.exists() ? profileSnap.data() : {};

            // Upload images to Cloudinary
            const uploadedUrls: string[] = [];
            for (const imageUri of images) {
                const url = await uploadToCloudinary(imageUri);
                if (url) {
                    uploadedUrls.push(url);
                }
            }

            if (uploadedUrls.length === 0) {
                throw new Error('Failed to upload images');
            }

            // Create post document
            const postsRef = collection(db, "posts");
            await addDoc(postsRef, {
                userId: user.uid,
                displayName: profileData.full_name || 'Contractor',
                photoUrl: profileData.photoUrl || null,
                userTag: profileData.userTag || '0000',
                specialty: profileData.specialty || 'General',
                images: uploadedUrls,
                caption: caption.trim(),
                worksCount: 0,
                commentsCount: 0,
                visibility,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success!', 'Your post has been shared with the community.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.log('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.background }]} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Project</Text>
                    <TouchableOpacity onPress={handlePost} disabled={uploading || images.length === 0}>
                        {uploading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={[styles.headerPostAction, images.length === 0 && styles.headerPostActionDisabled]}>
                                Post
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* 1. Caption Input (Minimalist) */}
                        <View style={styles.captionSection}>
                            {profile?.photoUrl || auth.currentUser?.photoURL ? (
                                <Image
                                    source={{ uri: profile?.photoUrl || auth.currentUser?.photoURL }}
                                    style={styles.userAvatar}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={[styles.userAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }]}>
                                    <Text style={{ color: COLORS.white, fontWeight: '700' }}>
                                        {profile?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </Text>
                                </View>
                            )}
                            <TextInput
                                style={styles.captionInput}
                                placeholder="What are you working on today?"
                                placeholderTextColor={COLORS.textDim}
                                multiline
                                maxLength={500}
                                value={caption}
                                onChangeText={setCaption}
                                autoFocus={false}
                            />
                        </View>

                        {/* 2. Image Grid */}
                        <View style={styles.mediaSection}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
                                <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                                    <LinearGradient
                                        colors={GRADIENTS.surface as [string, string]}
                                        style={styles.addImageGradient}
                                    >
                                        <Ionicons name="camera" size={28} color={COLORS.primary} />
                                        <Text style={styles.addImageText}>Add Photos</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {images.map((uri, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                        <Image source={{ uri }} style={styles.imagePreview} contentFit="cover" />
                                        <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                                            <Ionicons name="close-circle" size={24} color={'#EF4444'} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* 3. Options */}
                        <View style={styles.optionsSection}>
                            <TouchableOpacity style={styles.optionRow} onPress={() => setVisibility(v => v === 'public' ? 'followers' : 'public')}>
                                <View style={styles.optionIcon}>
                                    <Ionicons name={visibility === 'public' ? "globe-outline" : "people-outline"} size={24} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionLabel}>Visibility</Text>
                                    <Text style={styles.optionValue}>{visibility === 'public' ? 'Everyone' : 'Followers Only'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionRow}>
                                <View style={styles.optionIcon}>
                                    <Ionicons name="location-outline" size={24} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionLabel}>Location</Text>
                                    <Text style={styles.optionValue}>Add Location</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (COLORS: any, GRADIENTS: any, GLASS: any, SPACING: any, RADIUS: any, FONT_SIZES: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    closeButton: {
        padding: SPACING.xs,
        marginLeft: -SPACING.xs,
    },
    headerTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerPostAction: {
        fontSize: FONT_SIZES.m,
        fontWeight: '700',
        color: COLORS.primary,
    },
    headerPostActionDisabled: {
        color: COLORS.textDim,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.xxl,
    },

    // Caption
    captionSection: {
        flexDirection: 'row',
        padding: SPACING.l,
        gap: SPACING.m,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceHighlight,
    },
    captionInput: {
        flex: 1,
        fontSize: FONT_SIZES.l,
        color: COLORS.text,
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: SPACING.xs,
    },

    // Media
    mediaSection: {
        marginBottom: SPACING.l,
    },
    mediaScroll: {
        paddingHorizontal: SPACING.l,
        gap: SPACING.m,
    },
    addImageButton: {
        width: 120,
        height: 160,
        borderRadius: RADIUS.m,
        overflow: 'hidden',
    },
    addImageGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        borderRadius: RADIUS.m,
    },
    addImageText: {
        marginTop: SPACING.s,
        fontSize: FONT_SIZES.xs,
        color: COLORS.primary,
        fontWeight: '600',
    },
    imageWrapper: {
        width: 120,
        height: 160,
        borderRadius: RADIUS.m,
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceHighlight,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
    },

    // Options
    optionsSection: {
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        backgroundColor: COLORS.background, // Alternating bg or plain
    },
    optionIcon: {
        width: 40,
        alignItems: 'center',
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        fontSize: FONT_SIZES.m,
        color: COLORS.text,
        fontWeight: '500',
    },
    optionValue: {
        fontSize: FONT_SIZES.s,
        color: COLORS.primary,
        marginTop: 2,
    },
});
