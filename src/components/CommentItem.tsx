import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { collection, query, orderBy, onSnapshot, getFirestore, limit } from 'firebase/firestore';
import { THEMES, SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';

interface CommentItemProps {
    postId: string;
    comment: {
        id: string;
        userId: string;
        displayName: string;
        photoUrl?: string;
        text: string;
        createdAt: any;
        replyCount?: number;
    };
    onReplyPress?: (commentId: string, userName: string, userId: string) => void;
    onUserPress?: (userId: string) => void;
    isReply?: boolean;
    parentCommentId?: string;
    initialExpanded?: boolean;
    isHighlighted?: boolean;
}

export function CommentItem({ postId, comment, onReplyPress, onUserPress, isReply = false, parentCommentId, initialExpanded = false, isHighlighted = false }: CommentItemProps) {
    const { currentTheme } = useTheme();
    const { colors: COLORS, gradients: GRADIENTS, glass: GLASS } = currentTheme;
    const [showReplies, setShowReplies] = useState(initialExpanded);
    const [replies, setReplies] = useState<any[]>([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [repliesLimit, setRepliesLimit] = useState(3);
    const db = getFirestore();
    const styles = getStyles(COLORS, SPACING, RADIUS, FONT_SIZES);

    // Listener for replies (Saver Mode: only active when expanded)
    useEffect(() => {
        if (!showReplies || isReply) return;

        setLoadingReplies(true);
        const repliesRef = collection(db, "posts", postId, "comments", comment.id, "replies");
        const q = query(repliesRef, orderBy("createdAt", "asc"), limit(repliesLimit));

        const unsubscribe = onSnapshot(q, (snap) => {
            const repliesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReplies(repliesData);
            setLoadingReplies(false);
        }, (error) => {
            console.log('[COMMENT_ITEM] Error listening to replies:', error);
            setLoadingReplies(false);
        });

        return () => unsubscribe();
    }, [showReplies, isReply, postId, comment.id, repliesLimit]);

    const loadMoreReplies = () => {
        setRepliesLimit(prev => prev + 10);
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

    const toggleReplies = () => {
        setShowReplies(!showReplies);
    };

    return (
        <View style={[
            styles.outerContainer,
            isHighlighted && { backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.m }
        ]}>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.avatarBorder}
                    onPress={() => onUserPress?.(comment.userId)}
                >
                    {comment.photoUrl ? (
                        <Image source={{ uri: comment.photoUrl }} style={styles.avatar} contentFit="cover" />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarPlaceholderText}>{comment.displayName?.charAt(0)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => onUserPress?.(comment.userId)}>
                            <Text style={styles.displayName}>{comment.displayName}</Text>
                        </TouchableOpacity>
                        <Text style={styles.timeAgo}>• {formatTimeAgo(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={() => onReplyPress?.(parentCommentId || comment.id, comment.displayName, comment.userId)}>
                            <Text style={styles.actionText}>Reply</Text>
                        </TouchableOpacity>
                    </View>

                    {/* View/Hide Replies Button - Standard TikTok Style */}
                    {!isReply && comment.replyCount && comment.replyCount > 0 && (
                        <TouchableOpacity style={styles.viewRepliesBtn} onPress={toggleReplies}>
                            <View style={styles.viewRepliesLine} />
                            <Text style={styles.viewRepliesText}>
                                {showReplies
                                    ? `Hide ${comment.replyCount === 1 ? 'reply' : 'replies'}`
                                    : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`
                                }
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Expanded Replies Section */}
            {!isReply && showReplies && (
                <View style={styles.repliesWrapper}>
                    {/* Vertical connector line for the thread */}
                    <View style={styles.threadLine} />

                    <View style={styles.repliesList}>
                        {replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                postId={postId}
                                comment={reply}
                                isReply={true}
                                onReplyPress={onReplyPress}
                                onUserPress={onUserPress}
                                parentCommentId={comment.id}
                            />
                        ))}

                        {/* Load More Replies Button */}
                        {(comment.replyCount ?? 0) > replies.length && (
                            <TouchableOpacity
                                style={styles.viewRepliesBtn}
                                onPress={loadMoreReplies}
                                disabled={loadingReplies}
                            >
                                <View style={styles.viewRepliesLine} />
                                {loadingReplies ? (
                                    <ActivityIndicator size="small" color={COLORS.textDim} style={{ marginLeft: 8 }} />
                                ) : (
                                    <Text style={styles.viewRepliesText}>
                                        View {(comment.replyCount || 0) - replies.length} more {(comment.replyCount || 0) - replies.length === 1 ? 'reply' : 'replies'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Hide replies option at the bottom for long threads */}
                        {replies.length > 5 && (
                            <TouchableOpacity style={styles.hideRepliesBtn} onPress={() => setShowReplies(false)}>
                                <Text style={styles.hideRepliesText}>Hide replies</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const getStyles = (COLORS: any, SPACING: any, RADIUS: any, FONT_SIZES: any) => StyleSheet.create({
    outerContainer: {
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s, // Reduced from SPACING.m
        gap: SPACING.s, // Reduced from SPACING.m
    },
    avatarBorder: {
        width: 32, // Reduced from 36
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        padding: 1.5,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: COLORS.primary,
        fontSize: 10, // Reduced from 12
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        // Removed background for a cleaner, shared space look
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2, // Reduced from 4
        gap: 6,
    },
    displayName: {
        color: COLORS.text,
        fontSize: 12, // More standard
        fontWeight: '700',
    },
    timeAgo: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '500',
    },
    commentText: {
        color: COLORS.text,
        fontSize: 13,
        lineHeight: 18,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: SPACING.m,
    },
    actionText: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '700',
    },
    repliesWrapper: {
        flexDirection: 'row',
        marginLeft: 26, // Center of the avatar
        marginTop: 4,
    },
    threadLine: {
        width: 1.5,
        backgroundColor: COLORS.surfaceHighlight, // Subtle line
        marginBottom: 10,
        borderRadius: 1,
    },
    repliesList: {
        flex: 1,
        paddingLeft: 4,
    },
    viewRepliesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        paddingVertical: 4,
    },
    viewRepliesLine: {
        width: 20,
        height: 1,
        backgroundColor: COLORS.textMuted,
        marginRight: SPACING.s,
        opacity: 0.5,
    },
    viewRepliesText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },
    viewMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
        marginTop: 4,
        paddingVertical: 8,
    },
    viewMoreText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },
    hideRepliesBtn: {
        paddingLeft: 38,
        paddingVertical: 8,
    },
    hideRepliesText: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '700',
    }
});
