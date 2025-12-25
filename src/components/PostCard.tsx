import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { THEMES, SPACING, RADIUS, FONT_SIZES, ANIMATION } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width;

interface PostCardProps {
    post: {
        id: string;
        userId: string;
        displayName: string;
        photoUrl?: string;
        userTag: string;
        specialty: string;
        images: string[];
        caption: string;
        worksCount: number;
        commentsCount?: number;
        createdAt: any;
    };
    hasWorked: boolean;
    onWork: (postId: string) => void;
    onUserPress: (userId: string) => void;
    onPress?: (postId: string) => void;
}

export function PostCard({ post, hasWorked, onWork, onUserPress, onPress }: PostCardProps) {
    const [activeSlide, setActiveSlide] = useState(0);
    const { currentTheme } = useTheme();
    const { colors: COLORS, gradients: GRADIENTS, glass: GLASS } = currentTheme;
    const styles = getStyles(COLORS, GRADIENTS, GLASS, SPACING, RADIUS, FONT_SIZES, IMAGE_SIZE);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handleWork = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        scale.value = withSpring(1.3, { damping: 10, stiffness: 400 }, () => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        });
        onWork(post.id);
    };

    const formatTimeAgo = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const seconds = timestamp.seconds || timestamp._seconds || Math.floor(Date.now() / 1000);
        const diff = Math.floor(Date.now() / 1000) - seconds;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return new Date(seconds * 1000).toLocaleDateString();
    };

    const getOptimizedImageUrl = (url: string, targetWidth: number) => {
        if (!url || !url.includes('cloudinary')) return url;
        if (url.includes('f_auto,q_auto')) return url;
        return url.replace('/upload/', `/upload/f_auto,q_auto,w_${Math.floor(targetWidth)}/`);
    };

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems?.length > 0) {
            setActiveSlide(viewableItems[0].index);
        }
    }).current;

    return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.cardWrapper}>
            <View style={styles.card}>
                {/* Images Section */}
                {post.images && post.images.length > 0 && (
                    <View style={styles.imageContainer}>
                        <FlatList
                            data={post.images}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => onPress?.(post.id)}
                                >
                                    <Image
                                        source={{ uri: getOptimizedImageUrl(item, IMAGE_SIZE) }}
                                        style={styles.postImage}
                                        contentFit="cover"
                                        transition={300}
                                    />
                                </TouchableOpacity>
                            )}
                        />

                        {/* Pagination dots */}
                        {post.images.length > 1 && (
                            <View style={styles.pagination}>
                                {post.images.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.paginationDot,
                                            { backgroundColor: i === activeSlide ? COLORS.white : 'rgba(255,255,255,0.5)' }
                                        ]}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Vertical Actions on the right - Made "finer" */}
                        <View style={styles.verticalActions}>
                            <TouchableOpacity style={styles.actionBtnVertical} onPress={() => onPress?.(post.id)}>
                                <Ionicons name="chatbubble-outline" size={18} color={COLORS.white} />
                                <Text style={styles.actionCountVertical}>{post.commentsCount || 0}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtnVertical} disabled>
                                <Ionicons name="share-outline" size={18} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Info & Caption Area - Redesigned to be "fino" */}
                <View style={styles.captionContainer}>
                    {/* User Info Above Caption */}
                    <View style={styles.userInfoRow}>
                        <View style={styles.userInfoLeft}>
                            <TouchableOpacity style={styles.avatarContainer} onPress={() => onUserPress(post.userId)}>
                                {post.photoUrl ? (
                                    <Image source={{ uri: post.photoUrl }} style={styles.avatar} contentFit="cover" />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                        <Text style={styles.avatarPlaceholderText}>{post.displayName?.charAt(0)}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <View style={styles.userTextMeta}>
                                <Text style={styles.userDisplayName}>
                                    {post.displayName}
                                    <Text style={styles.timeAgo}> • {formatTimeAgo(post.createdAt)}</Text>
                                </Text>
                                <Text style={styles.userTagName}>@{post.userTag}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.headerWorks} onPress={handleWork}>
                            <View style={styles.headerWorksCircle}>
                                <Ionicons
                                    name={hasWorked ? 'hammer' : 'hammer-outline'}
                                    size={22}
                                    color={hasWorked ? COLORS.primary : COLORS.textDim}
                                />
                            </View>
                            <Text style={[styles.headerWorksText, hasWorked && { color: COLORS.primary }]}>
                                {post.worksCount || 0}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {post.caption && (
                        <Text style={styles.captionText} numberOfLines={3}>
                            {post.caption}
                        </Text>
                    )}

                    {post.specialty && (
                        <View style={styles.tagContainer}>
                            <Ionicons name="construct" size={12} color={COLORS.primary} />
                            <Text style={styles.tagText}>{post.specialty}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
}

const getStyles = (COLORS: any, GRADIENTS: any, GLASS: any, SPACING: any, RADIUS: any, FONT_SIZES: any, IMAGE_SIZE: number) => StyleSheet.create({
    cardWrapper: {
        marginBottom: SPACING.l,
    },
    card: {
        overflow: 'hidden',
        ...GLASS.card,
        backgroundColor: COLORS.surface,
    },
    imageContainer: {
        position: 'relative',
    },
    postImage: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE * 1.3, // "Grandesita" 📸
        backgroundColor: COLORS.surfaceHighlight,
    },
    pagination: {
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    // Vertical actions - Finer style
    verticalActions: {
        position: 'absolute',
        right: 12,
        bottom: 20,
        gap: 16,
    },
    actionBtnVertical: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    actionCountVertical: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '800',
        marginTop: 2,
        position: 'absolute',
        bottom: -14,
    },
    actionCountActive: {
        color: COLORS.primary,
    },
    // Caption & User Info section
    captionContainer: {
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    userInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 50, // Avoid overlap with the absolute badge
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        padding: 1.5,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    userTextMeta: {
        marginLeft: 10,
    },
    userTagName: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: -0.2,
        marginTop: 0,
    },
    headerWorks: {
        position: 'absolute',
        right: 0,
        top: 15, // Pushing it further down vs name/avatar
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerWorksCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    headerWorksText: {
        fontSize: 11,
        fontWeight: '900',
        color: COLORS.textDim,
    },
    userDisplayName: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
    },
    timeAgo: {
        color: COLORS.textDim,
        fontSize: 11,
        fontWeight: '400',
    },
    captionText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.s,
        lineHeight: 20,
        marginTop: 2,
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    tagText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
