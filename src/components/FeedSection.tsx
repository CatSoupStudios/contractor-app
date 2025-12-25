import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    getFirestore, collection, query, where, orderBy, limit,
    startAfter, getDocs, doc, setDoc, deleteDoc, updateDoc,
    increment, serverTimestamp, getDoc, onSnapshot, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { PostCard } from '../components/PostCard';
import { GlassCard } from '../components/GlassCard';
import { DopamineButton } from '../components/DopamineButton';

const BATCH_SIZE = 8;

interface Post {
    id: string;
    userId: string;
    displayName: string;
    photoUrl?: string;
    userTag: string;
    specialty: string;
    images: string[];
    caption: string;
    worksCount: number;
    commentsCount: number;
    createdAt: any;
}

interface FeedSectionProps {
    onPostPress?: (postId: string) => void;
    registerSyncHandler?: (handler: (postId: string, data: { worksCount?: number, hasWorked?: boolean, commentsCount?: number }) => void) => void;
    registerLoadMoreHandler?: (handler: () => void) => void;
}

export function FeedSection({ onPostPress, registerSyncHandler, registerLoadMoreHandler }: FeedSectionProps) {
    const navigation = useNavigation<any>();
    const db = getFirestore();
    const user = auth.currentUser;
    const { currentTheme } = useTheme();
    const { colors: COLORS, gradients: GRADIENTS } = currentTheme;
    const styles = getStyles(COLORS, SPACING, RADIUS, FONT_SIZES);

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [myWorks, setMyWorks] = useState<Set<string>>(new Set());
    const [myCrew, setMyCrew] = useState<string[]>([]);
    const [myProfile, setMyProfile] = useState<any>(null);

    // Expose sync function to parent
    useEffect(() => {
        if (registerSyncHandler) {
            registerSyncHandler((postId, data) => {
                // Update local works set if provided
                if (data.hasWorked !== undefined) {
                    setMyWorks(prev => {
                        const updated = new Set(prev);
                        if (data.hasWorked) updated.add(postId);
                        else updated.delete(postId);
                        return updated;
                    });
                }

                // Update local posts array
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            worksCount: data.worksCount !== undefined ? data.worksCount : p.worksCount,
                            commentsCount: data.commentsCount !== undefined ? data.commentsCount : p.commentsCount
                        };
                    }
                    return p;
                }));
            });
        }
    }, [registerSyncHandler]);

    // Expose load more function to parent (Infinite Scroll)
    useEffect(() => {
        if (registerLoadMoreHandler) {
            registerLoadMoreHandler(() => fetchPosts(false));
        }
    }, [registerLoadMoreHandler]);

    // Fetch my profile
    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            const profileRef = doc(db, "profiles", user.uid);
            const unsubscribe = onSnapshot(profileRef, (snap) => {
                if (snap.exists()) {
                    setMyProfile({ id: snap.id, ...snap.data() });
                }
            });
            return () => unsubscribe();
        }, [user])
    );

    // ✅ DON CANGREJO ELITE OPTIMIZATION 🦀💎
    // Instead of querying collections (expensive/unreliable), 
    // we use a "recentWorks" array inside the user's profile.
    // This is 100% free (0 reads) as we already fetch the profile.
    React.useEffect(() => {
        if (myProfile?.recentWorks) {
            setMyWorks(new Set(myProfile.recentWorks));
            console.log(`[WORKS] Synced ${myProfile.recentWorks.length} interactions from profile 🦀💰`);
        }
    }, [myProfile?.recentWorks]);

    // Fetch crew list (who I follow)
    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            const crewRef = collection(db, "profiles", user.uid, "crew");
            const unsubscribe = onSnapshot(crewRef, (snap) => {
                const ids = snap.docs.map(d => d.id);
                setMyCrew(ids);
            });

            return () => unsubscribe();
        }, [user])
    );

    // ✅ ALGORITHM V2: THE FRESH MIX 🌊🦀
    // Freshness is King. Specialty is a bonus.
    const fetchPosts = async (refresh = false) => {
        if (!user) return;

        try {
            if (refresh) {
                setLastDoc(null);
                setHasMore(true);
            } else if (!hasMore || loadingMore) {
                return;
            } else {
                setLoadingMore(true);
            }

            const postsRef = collection(db, "posts");
            const mySpecialty = myProfile?.specialty;

            let finalPosts: Post[] = [];
            let latestDocRef: any = null;

            if (refresh) {
                console.log(`[ALGO] Fresh Mix Refresh (Specialty: ${mySpecialty || 'None'}) 🚀`);

                // 1. Fetch Fresh General Public Content
                const qGeneral = query(
                    postsRef,
                    where("visibility", "==", "public"),
                    orderBy("createdAt", "desc"),
                    limit(BATCH_SIZE)
                );
                const snapGeneral = await getDocs(qGeneral);
                const generalPosts = snapGeneral.docs.map(d => ({ id: d.id, ...d.data() } as Post));
                latestDocRef = snapGeneral.docs[snapGeneral.docs.length - 1];

                // 2. Fetch Specialty Affinity (Bonus Mix)
                let specialtyPosts: Post[] = [];
                if (mySpecialty) {
                    const qSpecialty = query(
                        postsRef,
                        where("visibility", "==", "public"),
                        where("specialty", "==", mySpecialty),
                        orderBy("createdAt", "desc"),
                        limit(Math.floor(BATCH_SIZE / 2))
                    );
                    const snapSpecialty = await getDocs(qSpecialty);
                    specialtyPosts = snapSpecialty.docs.map(d => ({ id: d.id, ...d.data() } as Post));
                }

                // 3. Smart Merge & Strictly Chronological Sort
                // Deduplicate by ID
                const mergedMap = new Map<string, Post>();
                [...generalPosts, ...specialtyPosts].forEach(p => mergedMap.set(p.id, p));

                finalPosts = Array.from(mergedMap.values()).sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA; // Descending (fresher first)
                });

                setPosts(finalPosts);
                setLastDoc(latestDocRef);
                setHasMore(snapGeneral.docs.length === BATCH_SIZE);

            } else {
                // PAGINATION: Just continue general discovery
                if (!lastDoc) return;

                const qNext = query(
                    postsRef,
                    where("visibility", "==", "public"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastDoc),
                    limit(BATCH_SIZE)
                );
                const snapshot = await getDocs(qNext);
                const nextPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));

                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = nextPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });

                setLastDoc(snapshot.docs[snapshot.docs.length - 1] || lastDoc);
                setHasMore(snapshot.docs.length === BATCH_SIZE);
            }

        } catch (error) {
            console.log("Error fetching posts:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Trigger first fetch
    useFocusEffect(
        useCallback(() => {
            // If profile is already there, fetch immediately
            if (myProfile) {
                fetchPosts(true);
            }
        }, [myProfile !== null]) // Only trigger once when profile flips from null to something
    );

    // Initial load if profile takes too long (fallback to general)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (posts.length === 0 && loading) {
                console.log("[ALGO] Profile slow, falling back to discovery ⏱️");
                fetchPosts(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleWork = async (postId: string) => {
        if (!user) {
            console.log('[WORKS] No user authenticated');
            return;
        }

        // ✅ LAZY LOAD: Check work status only on first interaction
        if (!myWorks.has(postId)) {
            // First time clicking on this post - check if we already worked on it
            try {
                const workRef = doc(db, "posts", postId, "works", user.uid);
                const workSnap = await getDoc(workRef);
                if (workSnap.exists()) {
                    // We already worked on this - add to cache
                    setMyWorks(prev => new Set([...prev, postId]));
                    return; // Don't toggle, just update UI
                }
            } catch (error) {
                console.error('[WORKS] Error checking work status:', error);
            }
        }

        const hasWorked = myWorks.has(postId);
        const workRef = doc(db, "posts", postId, "works", user.uid);
        const postRef = doc(db, "posts", postId);

        console.log(`[WORKS] ${hasWorked ? 'Removing' : 'Adding'} work on post ${postId}`);

        // Optimistic update
        setMyWorks(prev => {
            const updated = new Set(prev);
            if (hasWorked) {
                updated.delete(postId);
            } else {
                updated.add(postId);
            }
            return updated;
        });

        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const currentCount = p.worksCount || 0;
                const newCount = Math.max(0, currentCount + (hasWorked ? -1 : 1));
                return { ...p, worksCount: newCount };
            }
            return p;
        }));

        try {
            if (hasWorked) {
                // Remove work
                await deleteDoc(workRef);
                await updateDoc(postRef, { worksCount: increment(-1) });

                // Update profile cache
                const profileRef = doc(db, "profiles", user.uid);
                await updateDoc(profileRef, {
                    recentWorks: arrayRemove(postId)
                });
                console.log(`[WORKS] Successfully removed work from post ${postId}`);
            } else {
                // Add work
                await setDoc(workRef, {
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });
                await updateDoc(postRef, { worksCount: increment(1) });

                // Update profile cache
                const profileRef = doc(db, "profiles", user.uid);
                await updateDoc(profileRef, {
                    recentWorks: arrayUnion(postId)
                });
                console.log(`[WORKS] Successfully added work to post ${postId}`);

                // Send notification to post owner (not to self)
                const post = posts.find(p => p.id === postId);
                if (post && post.userId !== user.uid) {
                    try {
                        const notifId = `work_${user.uid}_${postId}`;
                        const notifRef = doc(db, "notifications", post.userId, "items", notifId);
                        await setDoc(notifRef, {
                            type: 'work',
                            fromUserId: user.uid,
                            fromUserName: myProfile?.full_name || user.displayName || 'Someone',
                            fromUserPhoto: myProfile?.photoUrl || null,
                            postId: postId,
                            postImage: post.images?.[0] || null,
                            message: `gave WORKS to your post`,
                            read: false,
                            createdAt: serverTimestamp()
                        });
                        console.log(`[WORKS] Notification sent to user ${post.userId}`);
                    } catch (notifError) {
                        console.log('[WORKS] Notification failed (non-critical):', notifError);
                    }
                }
            }
        } catch (error) {
            console.error("[WORKS] Error toggling work:", error);
            // Revert on error omitted for brevity but recommended in production
        }
    };

    const handleUserPress = (userId: string) => {
        if (userId === user?.uid) {
            navigation.navigate('Tabs', { screen: 'ProfileTab' });
        } else {
            navigation.navigate('PublicProfile', {
                userId,
                isFollowing: myCrew.includes(userId)
            });
        }
    };

    const handleLoadMore = () => {
        if (hasMore && !loadingMore) {
            fetchPosts(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (posts.length === 0) {
        return (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyContainer}>
                <GlassCard variant="flat" style={styles.emptyCard}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="hammer-outline" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No Posts Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Be the first to share your work with the community!
                    </Text>
                    <DopamineButton
                        title="Create First Post"
                        variant="gradient"
                        onPress={() => navigation.navigate('CreatePost')}
                        style={styles.emptyButton}
                        icon={<Ionicons name="add" size={20} color={COLORS.white} />}
                    />
                </GlassCard>
            </Animated.View>
        );
    }

    return (
        <View style={styles.container}>
            {posts.map((post, index) => (
                <PostCard
                    key={post.id}
                    post={post}
                    hasWorked={myWorks.has(post.id)}
                    onWork={handleWork}
                    onUserPress={handleUserPress}
                    onPress={onPostPress}
                />
            ))}

            {loadingMore && (
                <View style={styles.infiniteLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadMoreText}>Loading more jobs...</Text>
                </View>
            )}
        </View>
    );
}

const getStyles = (COLORS: any, SPACING: any, RADIUS: any, FONT_SIZES: any) => StyleSheet.create({
    container: {
        paddingTop: SPACING.s,
    },
    loadingContainer: {
        padding: SPACING.xxl,
        alignItems: 'center',
    },
    emptyContainer: {
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
    },
    emptyCard: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    emptyTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xl,
        fontWeight: '700',
        marginBottom: SPACING.s,
    },
    emptySubtitle: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.m,
        textAlign: 'center',
        marginBottom: SPACING.l,
        lineHeight: 22,
    },
    emptyButton: {
        minWidth: 180,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.m,
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.l,
        gap: SPACING.s,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    loadMoreText: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },
    infiniteLoading: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        opacity: 0.7,
    }
});
