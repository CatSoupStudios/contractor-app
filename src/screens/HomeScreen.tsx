import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StatusBar, StyleSheet,
  Dimensions, RefreshControl, TouchableOpacity, Modal, FlatList, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot, orderBy, updateDoc, writeBatch, setDoc, deleteDoc, increment, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

import { auth } from '../services/firebase';
import { THEMES, SPACING, RADIUS, FONT_SIZES, ANIMATION, SHADOWS } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { DopamineButton } from '../components/DopamineButton';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { FeedSection } from '../components/FeedSection';
import { PostPreviewModal } from '../components/PostPreviewModal';
import { getStyles } from '../styles/HomeScreen.styles';

const { width } = Dimensions.get('window');
const PROFILE_CACHE_KEY = 'cached_profile';

// Helper to format time like "2h ago", "3d ago"
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const { colors: COLORS, gradients: GRADIENTS, glass: GLASS } = currentTheme;
  const styles = getStyles(COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS);

  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPostPreview, setShowPostPreview] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [myCrew, setMyCrew] = useState<string[]>([]);

  // Scroll & Refresh logic
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  // Reference to FeedSection's sync function
  const feedSyncRef = useRef<((postId: string, data: { hasWorked?: boolean, worksCount?: number, commentsCount?: number }) => void) | null>(null);

  const db = getFirestore();

  // Real-time profile listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Load from cache first for instant UI
    const loadCache = async () => {
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached && !profile) {
        setProfile(JSON.parse(cached));
        setLoading(false);
      }
    };
    loadCache();

    const docRef = doc(db, "profiles", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const freshProfile = docSnap.data();
        setProfile(freshProfile);
        AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(freshProfile));
      }
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.log("Profile listener error:", error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // onSnapshot will handle the update if Firestore data changes, 
    // but we can manually trigger a small delay for UV feel.
    setTimeout(() => setRefreshing(false), 1000);
  };

  const scrollY = useRef(0);

  // Interaction-based refresh logic
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      const isFocused = navigation.isFocused();
      if (isFocused) {
        if (scrollY.current > 20) {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          onRefresh();
        }
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Listen for existing crew (to know who I follow)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Only fetch IDs for efficiency
    const crewRef = collection(db, "profiles", user.uid, "crew");
    const unsubscribe = onSnapshot(crewRef, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.id);
      setMyCrew(ids);
    });
    return () => unsubscribe();
  }, []);

  // Listen for notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notifRef = collection(db, "notifications", user.uid, "items");
    const notifQuery = query(notifRef, orderBy("createdAt", "desc"), limit(10));

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notifList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(notifList);
      const unread = notifList.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    }, (error) => {
      console.log('Notifications listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  const markAllRead = async () => {
    const user = auth.currentUser;
    if (!user || notifications.length === 0) return;

    const batch = writeBatch(db);
    notifications.forEach((n: any) => {
      if (!n.read) {
        const notifRef = doc(db, "notifications", user.uid, "items", n.id);
        batch.update(notifRef, { read: true });
      }
    });
    try {
      await batch.commit();
    } catch (e) {
      console.log('Error marking notifications read:', e);
    }
  };

  const handleFollowBack = async (targetUserId: string, isAlreadyFollowing: boolean) => {
    const user = auth.currentUser;
    if (!user) return;

    // References
    const myCrewRef = doc(db, "profiles", user.uid, "crew", targetUserId);
    const theirFollowersRef = doc(db, "followers", targetUserId, "list", user.uid);
    const myProfileRef = doc(db, "profiles", user.uid);
    const theirProfileRef = doc(db, "profiles", targetUserId);

    try {
      if (isAlreadyFollowing) { // UNFOLLOW
        const batch = writeBatch(db);
        batch.delete(myCrewRef);
        batch.delete(theirFollowersRef);
        batch.update(myProfileRef, { followingCount: increment(-1) });
        batch.update(theirProfileRef, { followersCount: increment(-1) });
        await batch.commit();
      } else { // FOLLOW
        const batch = writeBatch(db);

        // Get target user basic info for my crew list
        const targetProfileSnap = await getDoc(theirProfileRef);
        const targetData = targetProfileSnap.exists() ? targetProfileSnap.data() : {};

        const followData = {
          full_name: targetData.full_name || 'Worker',
          userTag: targetData.userTag || '0000',
          photoUrl: targetData.photoUrl || null,
          company_name: targetData.company_name || null,
          specialty: targetData.specialty || 'General',
          addedAt: new Date().toISOString()
        };
        batch.set(myCrewRef, followData);

        // Add to their followers list
        const myDataSnap = await getDoc(myProfileRef);
        const myData = myDataSnap.exists() ? myDataSnap.data() : { full_name: 'User', userTag: '0000', photoUrl: null };

        batch.set(theirFollowersRef, {
          full_name: myData.full_name || 'User',
          userTag: myData.userTag || '0000',
          photoUrl: myData.photoUrl || null,
          addedAt: new Date().toISOString()
        });

        batch.update(myProfileRef, { followingCount: increment(1) });
        batch.update(theirProfileRef, { followersCount: increment(1) });

        // Notification
        const notifRef = doc(collection(db, "notifications", targetUserId, "items"));
        batch.set(notifRef, {
          type: 'follow',
          fromUserId: user.uid,
          fromUserName: myData.full_name || 'User',
          fromUserPhoto: myData.photoUrl || null,
          message: `${myData.full_name || 'Someone'} started following you`,
          read: false,
          createdAt: serverTimestamp(),
        });

        // COMMIT MAIN ACTION
        await batch.commit();

        // DECOUPLED: Cleanup Ignored Suggestions
        try {
          const ignoredRef = doc(db, "profiles", user.uid, "ignored_suggestions", targetUserId);
          await deleteDoc(ignoredRef);
        } catch (e) { console.log('Follow back un-ignore fail safe:', e); }
      }
    } catch (error) {
      console.log('Toggle follow error:', error);
      Alert.alert("Error", "Could not update follow status");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const user = auth.currentUser;

  const getFirstName = (fullName?: string) => {
    if (!fullName) return 'Contractor';
    return fullName.trim().split(' ')[0];
  };

  const renderHeader = () => (
    <View style={{ backgroundColor: COLORS.background }}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        {/* Row 1: Logo and Global Actions */}
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <Text style={styles.logoP}>P</Text>
            <Text style={styles.logoRest}>rojectley</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={toggleTheme}
            >
              <Ionicons
                name={isDark ? "sunny-outline" : "moon-outline"}
                size={20}
                color={COLORS.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionIcon, { marginLeft: 8 }]}
              onPress={() => {
                setShowNotifications(true);
                markAllRead();
              }}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Status Update Area */}
        <View style={styles.headerBottom}>
          <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'ProfileTab' })}>
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.headerAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                <Text style={styles.headerAvatarText}>
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusContainer}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Text style={styles.firstName}>Show the crew your latest progress...</Text>
            <Ionicons name="images-outline" size={20} color={COLORS.textMuted} style={styles.statusIcon} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      <View style={styles.divider} />
    </View>
  );

  const renderQuickActions = () => (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionsScroll}
      >
        {[
          { icon: 'add-circle', label: 'New Project', color: COLORS.primary },
          { icon: 'people', label: 'Find Team', color: COLORS.secondary },
          { icon: 'camera', label: 'Upload', color: COLORS.accentStart },
          { icon: 'stats-chart', label: 'Analytics', color: COLORS.accent },
        ].map((action, index) => (
          <Animated.View
            key={action.label}
            entering={FadeInRight.delay(300 + index * 100).springify()}
          >
            <GlassCard
              style={styles.quickActionCard}
              pressable
              onPress={() => { }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </GlassCard>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderStories = () => (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.storiesContainer}>
      <Text style={styles.sectionTitle}>Featured Contractors</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        {/* Add Story Button */}
        <View style={styles.storyItem}>
          <LinearGradient
            colors={GRADIENTS.primary as [string, string]}
            style={styles.addStoryCircle}
          >
            <Ionicons name="add" size={28} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.storyName}>Add Story</Text>
        </View>

        {/* Story Items */}
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View key={index} style={styles.storyItem}>
            <LinearGradient
              colors={index === 0 ? GRADIENTS.accent as [string, string] : ['transparent', 'transparent']}
              style={[
                styles.storyCircleGradient,
                index !== 0 && styles.storyCircleInactive
              ]}
            >
              <View style={styles.storyCircleInner}>
                <Ionicons name="person" size={24} color={COLORS.textMuted} />
              </View>
            </LinearGradient>
            <Text style={styles.storyName}>User {index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderEmptyFeed = () => (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyFeedContainer}>
      <GlassCard variant="flat" style={styles.emptyCard}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="rocket-outline" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.emptyTitle}>Your Feed Awaits</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to share your latest project with the community of contractors.
        </Text>

        <DopamineButton
          title="Post Your First Project"
          variant="gradient"
          onPress={() => navigation.navigate('AddProject')}
          style={styles.emptyButton}
          icon={<Ionicons name="add" size={20} color={COLORS.white} />}
        />
      </GlassCard>
    </Animated.View>
  );

  const renderStats = () => (
    <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Your Stats</Text>
      <View style={styles.statsGrid}>
        {[
          { value: '0', label: 'Projects', icon: 'briefcase-outline' },
          { value: '0', label: 'Connections', icon: 'people-outline' },
          { value: '0', label: 'Views', icon: 'eye-outline' },
        ].map((stat, index) => (
          <GlassCard key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </GlassCard>
        ))}
      </View>
    </Animated.View>
  );

  const handleClearAllNotifications = async () => {
    const user = auth.currentUser;
    if (!user || notifications.length === 0) return;

    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              notifications.forEach((n: any) => {
                const notifRef = doc(db, "notifications", user.uid, "items", n.id);
                batch.delete(notifRef);
              });
              await batch.commit();
              console.log('[NOTIF] Cleared all notifications');
              setShowNotifications(false);
            } catch (e) {
              console.log('[NOTIF] Error clearing notifications:', e);
              Alert.alert("Error", "Failed to clear notifications");
            }
          }
        }
      ]
    );
  };

  const handleCloseNotifications = async () => {
    setShowNotifications(false);
    // Mark all as read on close (don't delete)
    await markAllRead();
  };

  // Reference to FeedSection's load more function
  const feedLoadMoreRef = useRef<(() => void) | null>(null);
  const isFetchingMore = useRef(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.background }]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            scrollY.current = contentOffset.y;

            // Infinite Scroll Detection (with guard)
            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 600;
            if (isNearBottom && feedLoadMoreRef.current && !isFetchingMore.current) {
              isFetchingMore.current = true;
              feedLoadMoreRef.current();

              // Reset guard after short delay or via callback (here we use simple timeout for safety)
              setTimeout(() => { isFetchingMore.current = false; }, 2000);
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {renderHeader()}
          {renderStories()}

          {/* Feed Section */}
          <View style={styles.feedContainer}>
            <FeedSection
              onPostPress={(postId: string) => {
                setSelectedPostId(postId);
                setShowPostPreview(true);
              }}
              registerSyncHandler={(handler: any) => {
                feedSyncRef.current = handler;
              }}
              registerLoadMoreHandler={(handler: any) => {
                feedLoadMoreRef.current = handler;
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* NOTIFICATIONS MODAL */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseNotifications}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={styles.headerButtons}>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={handleClearAllNotifications} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleCloseNotifications} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notificationList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  !item.read && styles.unreadItem,
                  item.read && styles.readItem
                ]}
                onPress={async () => {
                  // Mark as read
                  if (!item.read) {
                    const notifRef = doc(db, "notifications", auth.currentUser?.uid!, "items", item.id);
                    updateDoc(notifRef, { read: true }).catch(e => console.log(e));
                  }

                  setShowNotifications(false);

                  // Different behavior based on notification type
                  if ((item.type === 'work' || item.type === 'comment') && item.postId) {
                    // Open post preview modal for work and comment notifications
                    setSelectedPostId(item.postId);
                    setHighlightedCommentId(item.commentId || null);
                    setShowPostPreview(true);
                  } else if (item.type === 'follow') {
                    // Navigate to profile for follow notifications
                    navigation.navigate('PublicProfile', {
                      userId: item.fromUserId,
                      isFollowing: myCrew.includes(item.fromUserId)
                    });
                  }
                }}
              >
                {/* Type icon badge */}
                <View style={styles.notificationIconBadge}>
                  <Ionicons
                    name={item.type === 'work' ? 'hammer' : item.type === 'comment' ? 'chatbubble' : 'person-add'}
                    size={14}
                    color={COLORS.white}
                  />
                </View>

                {/* Avatar */}
                {item.fromUserPhoto ? (
                  <Image source={{ uri: item.fromUserPhoto }} style={styles.notificationAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.notificationAvatar, styles.notificationAvatarPlaceholder]}>
                    <Ionicons name="person" size={18} color={COLORS.textDim} />
                  </View>
                )}

                {/* Content */}
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationText, item.read && styles.notificationTextRead]}>
                    <Text style={styles.notificationName}>{item.fromUserName || 'Someone'}</Text>
                    {' '}{item.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {item.createdAt?.seconds
                      ? formatTimeAgo(item.createdAt.seconds * 1000)
                      : 'Just now'}
                  </Text>
                </View>

                {/* Post thumbnail for WORKS notifications */}
                {item.type === 'work' && item.postImage && (
                  <Image
                    source={{ uri: item.postImage }}
                    style={styles.notificationPostThumb}
                    contentFit="cover"
                  />
                )}

                {/* Follow back button for follow notifications */}
                {item.type === 'follow' && (
                  <TouchableOpacity
                    onPress={async (e) => {
                      e.stopPropagation();
                      await handleFollowBack(item.fromUserId, myCrew.includes(item.fromUserId));
                      if (!item.read) {
                        const notifRef = doc(db, "notifications", auth.currentUser?.uid!, "items", item.id);
                        await updateDoc(notifRef, { read: true });
                      }
                    }}
                    style={[
                      styles.followBackBtn,
                      myCrew.includes(item.fromUserId) && styles.followBackBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.followBackBtnText,
                      myCrew.includes(item.fromUserId) && styles.followBackBtnTextActive
                    ]}>
                      {myCrew.includes(item.fromUserId) ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Unread dot */}
                {!item.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* POST PREVIEW MODAL */}
      <PostPreviewModal
        visible={showPostPreview}
        postId={selectedPostId}
        initialCommentId={highlightedCommentId}
        myCrew={myCrew}
        onClose={() => {
          setShowPostPreview(false);
          setSelectedPostId(null);
          setHighlightedCommentId(null);
        }}
        onWorkToggled={(postId, hasWorked, count) => {
          // Sync back to FeedSection instantly
          feedSyncRef.current?.(postId, { hasWorked, worksCount: count });
        }}
        onCommentAdded={(postId, count) => {
          // Sync back to FeedSection instantly (cablesito 🔌)
          feedSyncRef.current?.(postId, { commentsCount: count });
        }}
      />
    </View>
  );
}
