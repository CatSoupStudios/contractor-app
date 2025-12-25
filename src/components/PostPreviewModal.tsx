import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Modal, TouchableOpacity, StyleSheet,
    Dimensions, FlatList, ActivityIndicator, Alert, Platform,
    ScrollView, KeyboardAvoidingView, TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    getFirestore, doc, getDoc, setDoc, deleteDoc,
    updateDoc, increment, serverTimestamp, onSnapshot,
    arrayUnion, arrayRemove, collection, query, orderBy,
    runTransaction, limit, startAfter, getDocs
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { THEMES, SPACING, RADIUS, FONT_SIZES, ANIMATION } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { CommentItem } from './CommentItem';

const { width } = Dimensions.get('window');

interface PostPreviewModalProps {
    visible: boolean;
    postId: string | null;
    initialCommentId?: string | null;
    onClose: () => void;
    onWorkToggled?: (postId: string, hasWorked: boolean, count: number) => void;
    onCommentAdded?: (postId: string, count: number) => void;
    myCrew?: string[];
}

export function PostPreviewModal({ visible, postId, initialCommentId, onClose, onWorkToggled, onCommentAdded, myCrew = [] }: PostPreviewModalProps) {
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    const [hasMoreComments, setHasMoreComments] = useState(false);
    const [lastCommentDoc, setLastCommentDoc] = useState<any>(null);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [hasWorked, setHasWorked] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [myProfile, setMyProfile] = useState<any>(null);
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string, name: string, userId: string } | null>(null);
    const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);

    const inputRef = useRef<TextInput>(null);
    const mainScrollRef = useRef<ScrollView>(null);
    const [commentsY, setCommentsY] = useState(0);
    const insets = useSafeAreaInsets();
    const db = getFirestore();
    const COMMENT_BATCH_SIZE = 10;
    const { currentTheme, isDark } = useTheme();
    const { colors: COLORS, gradients: GRADIENTS, glass: GLASS } = currentTheme;
    const styles = getStyles(COLORS, GRADIENTS, GLASS, SPACING, RADIUS, FONT_SIZES, width, insets);
    const user = auth.currentUser;
    const navigation = useNavigation<any>();
    const scale = useSharedValue(1);

    const handleUserPress = (targetUserId: string) => {
        if (!targetUserId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose(); // Close modal first

        if (targetUserId === user?.uid) {
            navigation.navigate('Tabs', { screen: 'ProfileTab' });
        } else {
            navigation.navigate('PublicProfile', {
                userId: targetUserId,
                isFollowing: myCrew.includes(targetUserId)
            });
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    // Fetch user profile for notifications
    useEffect(() => {
        if (!user) return;
        const profileRef = doc(db, "profiles", user.uid);
        const unsubscribe = onSnapshot(profileRef, (snap) => {
            if (snap.exists()) {
                setMyProfile({ id: snap.id, ...snap.data() });
            }
        });
        return () => unsubscribe();
    }, [user]);

    const fetchComments = async (isInitial = false) => {
        if (!postId || skippingFetch.current) return;
        if (!isInitial && (!hasMoreComments || loadingComments)) return;

        setLoadingComments(true);
        try {
            const commentsRef = collection(db, "posts", postId, "comments");
            let q = query(
                commentsRef,
                orderBy("createdAt", "desc"),
                limit(COMMENT_BATCH_SIZE)
            );

            if (!isInitial && lastCommentDoc) {
                q = query(q, startAfter(lastCommentDoc));
            }

            const snap = await getDocs(q);
            let newComments = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // DEEP LINKING: If initial load and we have a target comment, ensure it's in the list
            if (isInitial && initialCommentId) {
                const alreadyFound = newComments.find(c => c.id === initialCommentId);
                if (!alreadyFound) {
                    const targetRef = doc(db, "posts", postId, "comments", initialCommentId);
                    const targetSnap = await getDoc(targetRef);
                    if (targetSnap.exists()) {
                        const targetData = { id: targetSnap.id, ...targetSnap.data() };
                        // Add to top of initial batch
                        newComments = [targetData, ...newComments];
                    }
                } else {
                    // Move it to top if found but not at top
                    newComments = [
                        alreadyFound,
                        ...newComments.filter(c => c.id !== initialCommentId)
                    ];
                }
            }

            if (isInitial) {
                setComments(newComments);
            } else {
                setComments(prev => [...prev, ...newComments]);
            }

            setLastCommentDoc(snap.docs[snap.docs.length - 1]);
            setHasMoreComments(snap.docs.length === COMMENT_BATCH_SIZE);
        } catch (error) {
            console.log('[POST_PREVIEW] Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const skippingFetch = useRef(false);

    // Initial load
    useEffect(() => {
        if (!user) return;
        const profileRef = doc(db, "profiles", user.uid);
        getDoc(profileRef).then(snap => {
            if (snap.exists()) {
                setMyProfile(snap.data());
            }
        }).catch(e => console.log('[POST_PREVIEW] Error loading my profile:', e));
    }, [user]);

    useEffect(() => {
        if (!visible || !postId || !user) {
            setPost(null);
            setComments([]);
            setLastCommentDoc(null);
            setHasMoreComments(false);
            setExpandedThreadId(null);
            setLoading(true);
            return;
        }

        setLoading(true);
        const postRef = doc(db, "posts", postId);

        // Auto-expand if deep-linked to a comment thread
        if (initialCommentId) {
            setExpandedThreadId(initialCommentId);
        }

        // Listen to Post (we keep this real-time for likes/counts)
        const unsubscribePost = onSnapshot(postRef, async (postSnap) => {
            if (postSnap.exists()) {
                const postData = { id: postSnap.id, ...postSnap.data() };
                setPost(postData);

                const workRef = doc(db, "posts", postId, "works", user.uid);
                const workSnap = await getDoc(workRef);
                setHasWorked(workSnap.exists());
            } else {
                setPost(null);
                Alert.alert("Post Not Found", "This post may have been deleted.");
            }
            setLoading(false);
        }, (error) => {
            console.log('[POST_PREVIEW] Error fetching post:', error);
            setLoading(false);
        });

        // Fetch first batch of comments
        fetchComments(true);

        return () => {
            unsubscribePost();
        };
    }, [visible, postId, user, initialCommentId]);

    // Auto-scroll logic
    useEffect(() => {
        if (visible && initialCommentId && !loading && commentsY > 0) {
            // Give it a tiny delay to ensure layout is fully computed
            setTimeout(() => {
                mainScrollRef.current?.scrollTo({ y: commentsY - 20, animated: true });
            }, 300);
        }
    }, [visible, initialCommentId, loading, commentsY]);

    const handleAddComment = async () => {
        if (!user || !post || !commentText.trim() || submittingComment) return;

        setSubmittingComment(true);
        const text = commentText.trim();
        setCommentText(''); // Clear input immediately for feel

        const postRef = doc(db, "posts", post.id);
        let newCommentRef;

        if (replyingTo) {
            newCommentRef = doc(collection(db, "posts", post.id, "comments", replyingTo.id, "replies"));
        } else {
            newCommentRef = doc(collection(db, "posts", post.id, "comments"));
        }

        try {
            const now = new Date();
            const commentObj = {
                userId: user.uid,
                displayName: myProfile?.full_name || user.displayName || 'Someone',
                photoUrl: myProfile?.photoUrl || null,
                text: text,
                createdAt: { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0 } // Optimistic mock
            };

            await runTransaction(db, async (transaction) => {
                // Add the comment
                transaction.set(newCommentRef, {
                    ...commentObj,
                    createdAt: serverTimestamp()
                });

                // Increment comment count
                transaction.update(postRef, {
                    commentsCount: increment(1)
                });

                if (replyingTo) {
                    const parentCommentRef = doc(db, "posts", post.id, "comments", replyingTo.id);
                    transaction.update(parentCommentRef, {
                        replyCount: increment(1)
                    });
                }
            });

            // Optimistic update local list
            if (!replyingTo) {
                setComments(prev => [{ id: newCommentRef.id, ...commentObj }, ...prev]);
            } else {
                // If it's a reply, update parent count and auto-expand thread
                setComments(prev => prev.map(c =>
                    c.id === replyingTo.id ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
                ));
                setExpandedThreadId(replyingTo.id);
            }

            // --- SEND NOTIFICATION ---
            const targetUserId = replyingTo ? replyingTo.userId : post.userId;

            if (targetUserId !== user.uid) {
                // Notification for either the comment owner (reply) or post owner (main comment)
                const notifRef = doc(collection(db, "notifications", targetUserId, "items"));
                const notificationData = {
                    type: 'comment',
                    fromUserId: user.uid,
                    fromUserName: myProfile?.full_name || user.displayName || 'Someone',
                    fromUserPhoto: myProfile?.photoUrl || null,
                    postId: post.id,
                    postImage: post.images?.[0] || null,
                    message: replyingTo
                        ? `replied: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
                        : `commented: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
                    createdAt: serverTimestamp(),
                    read: false
                };

                // If it's a reply, we can add the commentId to help with navigation if needed
                if (replyingTo) {
                    (notificationData as any).commentId = replyingTo.id;
                }

                await setDoc(notifRef, notificationData);
            }

            setReplyingTo(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Notify parent to sync feed instantly (cablesito 🔌)
            onCommentAdded?.(post.id, (post.commentsCount || 0) + 1);
        } catch (error) {
            console.error("[POST_PREVIEW] Error adding comment:", error);
            setCommentText(text); // Restore text on failure
            Alert.alert("Error", "Could not post comment. Please try again.");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleWork = async () => {
        if (!user || !post) return;

        const workRef = doc(db, "posts", post.id, "works", user.uid);
        const postRef = doc(db, "posts", post.id);

        const newHasWorked = !hasWorked;
        setHasWorked(newHasWorked);
        setPost((prev: any) => ({
            ...prev,
            worksCount: Math.max(0, (prev.worksCount || 0) + (newHasWorked ? 1 : -1))
        }));

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        scale.value = withSpring(1.3, { damping: 10, stiffness: 400 }, () => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        });

        try {
            const profileRef = doc(db, "profiles", user.uid);

            if (!newHasWorked) {
                await deleteDoc(workRef);
                await updateDoc(postRef, { worksCount: increment(-1) });

                // Sync profile cache
                await updateDoc(profileRef, {
                    recentWorks: arrayRemove(post.id)
                });

                // Notify parent immediately
                onWorkToggled?.(post.id, false, Math.max(0, (post.worksCount || 0) - 1));
            } else {
                await setDoc(workRef, {
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });
                await updateDoc(postRef, { worksCount: increment(1) });

                // Sync profile cache
                await updateDoc(profileRef, {
                    recentWorks: arrayUnion(post.id)
                });

                // Notify parent immediately
                onWorkToggled?.(post.id, true, (post.worksCount || 0) + 1);

                if (post.userId !== user.uid) {
                    try {
                        const notifId = `work_${user.uid}_${post.id}`;
                        const notifRef = doc(db, "notifications", post.userId, "items", notifId);
                        await setDoc(notifRef, {
                            type: 'work',
                            fromUserId: user.uid,
                            fromUserName: myProfile?.full_name || user.displayName || 'Someone',
                            fromUserPhoto: myProfile?.photoUrl || null,
                            postId: post.id,
                            postImage: post.images?.[0] || null,
                            message: `gave WORKS to your post`,
                            read: false,
                            createdAt: serverTimestamp()
                        });
                    } catch (notifError) {
                        console.log('[POST_PREVIEW] Notification failed (non-critical):', notifError);
                    }
                }
            }
        } catch (error) {
            console.error("[POST_PREVIEW] Error toggling work:", error);
            setHasWorked(hasWorked);
            setPost((prev: any) => ({
                ...prev,
                worksCount: Math.max(0, (prev.worksCount || 0) + (hasWorked ? 1 : -1))
            }));
        }
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

    const handleClose = () => {
        setCommentText('');
        setActiveSlide(0);
        onClose();
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems?.length > 0) {
            setActiveSlide(viewableItems[0].index);
        }
    }).current;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header Navigation - Balanced padding for pageSheet modal */}
                <View style={[styles.header, { paddingTop: 16 }]}>
                    <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
                        <Ionicons name="chevron-down" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Post</Text>
                    <TouchableOpacity style={styles.optionsBtn}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Fetching details...</Text>
                    </View>
                ) : post ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            ref={mainScrollRef}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Animated.View entering={FadeInDown.duration(400)}>
                                {/* User Info Row */}
                                <View style={styles.postUserRow}>
                                    <TouchableOpacity
                                        style={styles.avatarBorder}
                                        onPress={() => handleUserPress(post.userId)}
                                    >
                                        {post.photoUrl ? (
                                            <Image source={{ uri: post.photoUrl }} style={styles.avatarSmall} contentFit="cover" />
                                        ) : (
                                            <View style={[styles.avatarSmall, styles.avatarPlaceholder]}>
                                                <Text style={styles.avatarPlaceholderText}>{post.displayName?.charAt(0)}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.userMeta}
                                        onPress={() => handleUserPress(post.userId)}
                                    >
                                        <Text style={styles.displayNameText}>{post.displayName}</Text>
                                        <Text style={styles.timeTag}>@{post.userTag} • {formatTimeAgo(post.createdAt)}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Media Section */}
                                <View style={styles.mediaContainer}>
                                    <FlatList
                                        data={post.images}
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        keyExtractor={(_, i) => i.toString()}
                                        onViewableItemsChanged={onViewableItemsChanged}
                                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                                        renderItem={({ item }) => (
                                            <Image source={{ uri: item }} style={styles.postImage} contentFit="cover" />
                                        )}
                                    />
                                    {post.images?.length > 1 && (
                                        <View style={styles.pagination}>
                                            {post.images.map((_: any, i: number) => (
                                                <View key={i} style={[styles.dot, activeSlide === i && styles.dotActive]} />
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Actions Bar */}
                                <View style={styles.actionsBar}>
                                    <TouchableOpacity style={styles.creativeAction} onPress={handleWork}>
                                        <Animated.View style={animatedStyle}>
                                            <Ionicons
                                                name={hasWorked ? "hammer" : "hammer-outline"}
                                                size={22}
                                                color={hasWorked ? COLORS.primary : COLORS.text}
                                            />
                                        </Animated.View>
                                        <Text style={[styles.actionLabel, hasWorked && styles.actionLabelActive]}>
                                            {post.worksCount || 0} WORKS
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.creativeAction}>
                                        <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
                                        <Text style={styles.actionLabel}>{post.commentsCount || 0} COMMENTS</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.creativeAction}>
                                        <Ionicons name="paper-plane-outline" size={20} color={COLORS.text} />
                                        <Text style={styles.actionLabel}>SHARE</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Caption Section */}
                                <View style={styles.captionArea}>
                                    <Text style={styles.captionText}>{post.caption}</Text>
                                </View>

                                {/* Comments Section */}
                                <View
                                    style={styles.commentsSection}
                                    onLayout={(e) => setCommentsY(e.nativeEvent.layout.y)}
                                >
                                    <View style={styles.commentsHeader}>
                                        <Text style={styles.commentsTitle}>Comments ({post.commentsCount || 0})</Text>
                                        <View style={styles.commentsLine} />
                                    </View>

                                    {comments.length > 0 ? (
                                        <View style={styles.commentsList}>
                                            {comments.map((item) => (
                                                <CommentItem
                                                    key={item.id}
                                                    postId={post.id}
                                                    comment={item}
                                                    initialExpanded={expandedThreadId === item.id}
                                                    isHighlighted={initialCommentId === item.id}
                                                    onReplyPress={(id, name, userId) => {
                                                        // THE TIKTOK TRICK: 
                                                        // Always use the top-level comment ID as the thread root for Firebase
                                                        // but notify the specific person we are replying to.
                                                        setReplyingTo({ id, name, userId });
                                                        inputRef.current?.focus();
                                                    }}
                                                    onUserPress={handleUserPress}
                                                />
                                            ))}

                                            {hasMoreComments && (
                                                <TouchableOpacity
                                                    style={styles.loadMoreBtn}
                                                    onPress={() => fetchComments()}
                                                    disabled={loadingComments}
                                                >
                                                    {loadingComments ? (
                                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                                    ) : (
                                                        <Text style={styles.loadMoreText}>Load more comments</Text>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={styles.emptyComments}>
                                            <Ionicons name="chatbubbles-outline" size={40} color={COLORS.textDim} style={{ opacity: 0.5 }} />
                                            <Text style={styles.emptyText}>No comments yet</Text>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        </ScrollView>

                        {/* Replying To Indicator */}
                        {replyingTo && (
                            <View style={styles.replyingToIndicator}>
                                <Text style={styles.replyingToText}>
                                    Replying to <Text style={{ fontWeight: '800', color: COLORS.primary }}>{replyingTo.name}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                    <Ionicons name="close-circle" size={18} color={COLORS.textDim} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Sticky Footer with Rounded Corners and solid background */}
                        <View style={[styles.footerSticky, { paddingBottom: Math.max(insets.bottom, SPACING.m) }]}>
                            <View style={styles.inputBarContainer}>
                                <Image
                                    source={{ uri: myProfile?.photoUrl || 'https://via.placeholder.com/40' }}
                                    style={styles.myAvatarInput}
                                />
                                <TextInput
                                    ref={inputRef}
                                    style={styles.textInput}
                                    placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment..."}
                                    placeholderTextColor={COLORS.textDim}
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline
                                    editable={!submittingComment}
                                />
                                <TouchableOpacity
                                    style={[styles.sendBtn, (!commentText.trim() || submittingComment) && { opacity: 0.5 }]}
                                    disabled={!commentText.trim() || submittingComment}
                                    onPress={handleAddComment}
                                >
                                    {submittingComment ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <Ionicons name="send" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                ) : (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={60} color={COLORS.textMuted} />
                        <Text style={styles.errorText}>Post not found</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.errorCloseBtn}>
                            <Text style={styles.errorCloseText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const getStyles = (COLORS: any, GRADIENTS: any, GLASS: any, SPACING: any, RADIUS: any, FONT_SIZES: any, width: number, insets: any) => {
    const SHADOWS_INT = {
        lg: {
            shadowColor: COLORS.background === '#0A0F1A' ? '#000' : '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: COLORS.background === '#0A0F1A' ? 0.3 : 0.1,
            shadowRadius: 10,
            elevation: 10,
        }
    };

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.m,
            paddingTop: Platform.OS === 'ios' ? 0 : 0, // Set to 0 to be as high as possible
            paddingBottom: SPACING.m,
            backgroundColor: COLORS.surface,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
        },
        headerTitle: {
            fontSize: FONT_SIZES.m,
            fontWeight: '800',
            color: COLORS.text,
            textTransform: 'uppercase',
            letterSpacing: 2,
        },
        backBtn: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 22,
        },
        optionsBtn: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContent: {
            paddingBottom: 150,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: SPACING.m,
            color: COLORS.textMuted,
            fontWeight: '600',
        },
        postUserRow: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.m,
        },
        avatarBorder: {
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: COLORS.primary,
            padding: 2,
        },
        avatarSmall: {
            width: '100%',
            height: '100%',
            borderRadius: 20,
        },
        avatarPlaceholder: {
            backgroundColor: COLORS.surfaceHighlight,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarPlaceholderText: {
            color: COLORS.primary,
            fontWeight: 'bold',
        },
        userMeta: {
            marginLeft: SPACING.m,
        },
        displayNameText: {
            color: COLORS.text,
            fontSize: FONT_SIZES.m,
            fontWeight: '700',
        },
        timeTag: {
            color: COLORS.textMuted,
            fontSize: FONT_SIZES.xs,
            marginTop: 2,
        },
        mediaContainer: {
            position: 'relative',
            width: width,
            aspectRatio: 1,
        },
        postImage: {
            width: width,
            height: width,
            backgroundColor: COLORS.surfaceHighlight,
        },
        pagination: {
            position: 'absolute',
            bottom: 15,
            alignSelf: 'center',
            flexDirection: 'row',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: 'rgba(0,0,0,0.3)',
        },
        dot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.4)',
        },
        dotActive: {
            backgroundColor: COLORS.white,
            width: 15,
        },
        actionsBar: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING.m,
            paddingVertical: SPACING.l,
            gap: SPACING.m,
        },
        creativeAction: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: RADIUS.l,
            gap: 8,
            ...GLASS.card,
            backgroundColor: COLORS.surfaceHighlight, // Override GLASS background with highlight
            borderWidth: 0,
        },
        actionLabel: {
            color: COLORS.text,
            fontSize: 10,
            fontWeight: '800',
            letterSpacing: 0.5,
        },
        actionLabelActive: {
            color: COLORS.primary,
        },
        captionArea: {
            paddingHorizontal: SPACING.m,
            paddingBottom: SPACING.l,
        },
        captionText: {
            color: COLORS.text,
            fontSize: FONT_SIZES.m,
            lineHeight: 24,
        },
        commentsSection: {
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            padding: SPACING.m,
        },
        commentsHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING.l,
            gap: SPACING.m,
        },
        commentsTitle: {
            color: COLORS.textMuted,
            fontSize: 12,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        commentsLine: {
            flex: 1,
            height: 1,
            backgroundColor: COLORS.border,
        },
        emptyComments: {
            paddingVertical: 40,
            alignItems: 'center',
            gap: 12,
        },
        emptyText: {
            color: COLORS.textDim,
            fontSize: FONT_SIZES.s,
            fontWeight: '600',
        },
        commentsList: {
            marginTop: SPACING.s,
        },
        loadMoreBtn: {
            paddingVertical: SPACING.m,
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadMoreText: {
            color: COLORS.primary,
            fontSize: 12,
            fontWeight: '700',
        },
        replyingToIndicator: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.m,
            paddingVertical: 8,
            backgroundColor: COLORS.surfaceHighlight,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
        },
        replyingToText: {
            color: COLORS.textMuted,
            fontSize: 12,
        },
        footerSticky: {
            backgroundColor: COLORS.surface, // Solid background
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            borderTopLeftRadius: RADIUS.xl, // Rounded corners at the top
            borderTopRightRadius: RADIUS.xl,
            paddingTop: SPACING.m,
            ...SHADOWS_INT.lg,
        },
        inputBarContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.surfaceHighlight,
            marginHorizontal: SPACING.m,
            paddingHorizontal: SPACING.m,
            paddingVertical: 10,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        myAvatarInput: {
            width: 34,
            height: 34,
            borderRadius: 17,
        },
        textInput: {
            flex: 1,
            marginLeft: SPACING.m,
            color: COLORS.text,
            fontSize: FONT_SIZES.s,
            maxHeight: 100,
        },
        sendBtn: {
            padding: 5,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            fontSize: FONT_SIZES.l,
            color: COLORS.textMuted,
            marginVertical: SPACING.m,
        },
        errorCloseBtn: {
            backgroundColor: COLORS.primary,
            paddingHorizontal: SPACING.l,
            paddingVertical: SPACING.m,
            borderRadius: RADIUS.m,
        },
        errorCloseText: {
            color: COLORS.white,
            fontWeight: '700',
        },
    });
};
