import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Modal,
  Dimensions,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  deleteDoc, updateDoc, increment, addDoc, serverTimestamp, writeBatch, onSnapshot
} from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import { auth } from '../services/firebase';
import { SPACING } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { DopamineButton } from '../components/DopamineButton';
import { FadeInDown } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { createStyles, modalWidth, CAROUSEL_HEIGHT } from '../styles/PublicProfileScreen.styles';

const { width: screenWidth } = Dimensions.get('window');
const PORTFOLIO_LIMIT = 9;

export default function PublicProfileScreen() {
  const { currentTheme: theme, isDark } = useTheme();
  const COLORS = theme.colors;
  const GRADIENTS = theme.gradients;
  const GLASS = theme.glass;
  const styles = useMemo(() => createStyles(COLORS, GLASS), [COLORS, GLASS]);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, isFollowing: initialFollowing } = route.params;
  const [isFollowing, setIsFollowing] = useState(initialFollowing || false);

  const db = getFirestore();
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState<any>(null);
  const [projectCount, setProjectCount] = useState<number>(0);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Carrusel optimizado
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    waitForInteraction: true,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index ?? 0);
    }
  }).current;

  // Query solo para proyectos PÚBLICOS (para mostrar las fotos)
  const qProjects = useMemo(() => {
    return query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(PORTFOLIO_LIMIT)
    );
  }, [db, userId]);

  const syncCrewData = useCallback(
    async (freshData: any) => {
      if (!currentUser || !isFollowing) return;
      try {
        const myCrewRef = doc(db, 'profiles', currentUser.uid, 'crew', userId);
        await setDoc(
          myCrewRef,
          {
            photoUrl: freshData.photoUrl || null,
            full_name: freshData.full_name || 'Worker',
            company_name: freshData.company_name || null,
            specialty: freshData.specialty || 'General',
            userTag: freshData.userTag || '0000',
            lastSeenAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.log('Crew sync skipped');
      }
    },
    [db, currentUser, isFollowing, userId]
  );

  // Listen to profile changes in real-time (for stats)
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'profiles', userId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const fresh = snap.data();
        setProfile(fresh);

        let rawCount = typeof fresh.publicProjectsCount === 'number' ? fresh.publicProjectsCount : 0;
        setProjectCount(Math.max(0, rawCount));

        // Sync crew data if we are following
        if (currentUser && isFollowing) {
          syncCrewData(fresh);
        }
      } else {
        setProfile(null);
        setProjectCount(0);
      }
      setLoading(false);
    }, (err) => {
      console.log('Error loading public profile:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [db, userId, currentUser, isFollowing, syncCrewData]);

  // Initial projects fetch (static)
  const fetchProjects = useCallback(async () => {
    try {
      const projSnap = await getDocs(qProjects);
      const projectsData = projSnap.docs.map((d) => ({ id: d.id, type: 'project', ...d.data() }));
      setUserProjects(projectsData);
    } catch (e) {
      console.log('Error loading public projects:', e);
    }
  }, [qProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Separate effect for posts with real-time listener
  useEffect(() => {
    if (!userId) return;

    const postsRef = collection(db, 'posts');
    const qPosts = query(
      postsRef,
      where('userId', '==', userId),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(12)
    );

    // Real-time listener for worksCount updates
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const postsData = snapshot.docs.map((d) => ({ id: d.id, type: 'post', ...d.data() }));
      setUserPosts(postsData);
      console.log(`[PUBLIC_PROFILE] Updated ${postsData.length} posts with real-time listener for user ${userId}`);
    }, (error) => {
      console.log('[PUBLIC_PROFILE] Posts listener error:', error);
    });

    return () => unsubPosts();
  }, [db, userId]);

  const handleCall = useCallback(() => {
    if (!profile?.phone) return Alert.alert('No Phone', "This user hasn't added a phone number.");
    Linking.openURL(`tel:${profile.phone}`);
  }, [profile?.phone]);

  const handleToggleFollow = async () => {
    if (!currentUser) return;

    // Optimistic update
    const newStatus = !isFollowing;
    setIsFollowing(newStatus);

    // References
    const myCrewRef = doc(db, "profiles", currentUser.uid, "crew", userId);
    const theirFollowersRef = doc(db, "followers", userId, "list", currentUser.uid);
    const myProfileRef = doc(db, "profiles", currentUser.uid);
    const theirProfileRef = doc(db, "profiles", userId);

    try {
      if (!newStatus) { // UNFOLLOW

        // --- STRICT UNFOLLOW LOGIC ---
        // ONLY remove "Me -> Them". 
        const batch = writeBatch(db);
        batch.delete(myCrewRef);
        batch.delete(theirFollowersRef);
        batch.update(myProfileRef, { followingCount: increment(-1) });
        batch.update(theirProfileRef, { followersCount: increment(-1) });

        // COMMIT MAIN
        await batch.commit();

        // DECOUPLED: Add to Ignored Suggestions
        try {
          const ignoredRef = doc(db, "profiles", currentUser.uid, "ignored_suggestions", userId);
          await setDoc(ignoredRef, { at: serverTimestamp() });
        } catch (e) { console.log('Ignore fail safe:', e); }

      } else { // FOLLOW
        const batch = writeBatch(db);

        const followData = {
          full_name: profile?.full_name || 'Worker',
          userTag: profile?.userTag || '0000',
          photoUrl: profile?.photoUrl || null,
          company_name: profile?.company_name || null,
          specialty: profile?.specialty || 'General',
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
        const notifRef = doc(collection(db, "notifications", userId, "items"));
        batch.set(notifRef, {
          type: 'follow',
          fromUserId: currentUser.uid,
          fromUserName: myData.full_name || 'User',
          fromUserPhoto: myData.photoUrl || null,
          message: `${myData.full_name || 'Someone'} started following you`,
          read: false,
          createdAt: serverTimestamp(),
        });

        // COMMIT MAIN
        await batch.commit();

        // DECOUPLED: Cleanup Ignored Suggestions
        try {
          const ignoredRef = doc(db, "profiles", currentUser.uid, "ignored_suggestions", userId);
          await deleteDoc(ignoredRef);
        } catch (e) { console.log('Un-ignore fail safe:', e); }
      }
    } catch (error) {
      console.log('Toggle follow error:', error);
      setIsFollowing(!newStatus); // Revert on error
      Alert.alert("Error", "Could not update follow status");
    }
  };

  const handleMessage = useCallback(() => {
    if (!currentUser) return Alert.alert("Sign In", "You must be signed in to send messages.");
    if (!isFollowing) return Alert.alert("Follow Required", "You must follow this contractor to send messages.");

    navigation.navigate('Chat', {
      otherUserId: userId,
      otherUserName: profile?.full_name,
      otherUserPhoto: profile?.photoUrl
    });
  }, [navigation, userId, profile, isFollowing, currentUser]);

  const closeModal = useCallback(() => {
    setSelectedProject(null);
    setActiveSlide(0);
  }, []);

  const renderCarouselItem = useCallback(({ item }: { item: string }) => {
    return (
      <View style={{ width: modalWidth, height: CAROUSEL_HEIGHT, overflow: 'hidden' }}>
        <Image
          source={{ uri: item }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
        />
      </View>
    );
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* COVER IMAGE */}
        <View style={styles.coverContainer}>
          {profile?.coverUrl ? (
            <Image
              source={{ uri: profile.coverUrl }}
              style={styles.coverImage}
              contentFit="cover"
              transition={500}
            />
          ) : (
            <LinearGradient
              colors={GRADIENTS.accent as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coverPlaceholder}
            />
          )}

          <LinearGradient
            colors={['transparent', COLORS.background]}
            style={styles.coverOverlay}
          />

          <SafeAreaView style={styles.topBar}>
            {/* No title here to match ProfileScreen */}
          </SafeAreaView>
        </View>

        {/* PROFILE */}
        <Animated.View entering={FadeInDown.springify()} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatar} contentFit="cover" transition={300} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.initials}>
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile?.full_name || 'Unknown'}</Text>
          <Text style={styles.specialty}>
            {profile?.specialty || 'General Contractor'} • {profile?.company_name || 'Independent'} • @{profile?.userTag || '0000'}
          </Text>

          {/* STATS ROW (Read-Only) */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{projectCount}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionIconOnly, !isFollowing && styles.actionPrimary]}
              onPress={handleToggleFollow}
            >
              <Ionicons
                name={isFollowing ? "person-remove-outline" : "person-add-outline"}
                size={22}
                color={isFollowing ? COLORS.text : COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                !isFollowing ? styles.actionLocked : styles.actionPrimary
              ]}
              onPress={handleMessage}
              disabled={!isFollowing}
            >
              <Ionicons
                name={!isFollowing ? "lock-closed-outline" : "chatbubble-ellipses-outline"}
                size={22}
                color={!isFollowing ? COLORS.textDim : COLORS.white}
              />
              <Text style={!isFollowing ? styles.actionTextLocked : styles.actionText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                !isFollowing ? styles.actionLocked : styles.actionPrimary
              ]}
              onPress={handleCall}
              disabled={!isFollowing}
            >
              <Ionicons
                name={!isFollowing ? "lock-closed-outline" : "call-outline"}
                size={22}
                color={!isFollowing ? COLORS.textDim : COLORS.white}
              />
              <Text style={!isFollowing ? styles.actionTextLocked : styles.actionText}>Call</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* COMBINED GALLERY - Projects & Posts */}
        <View style={styles.portfolioSection}>
          <View style={styles.portfolioHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="images-outline" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
              <Text style={styles.portfolioTitle}>Gallery</Text>
            </View>
            <Text style={styles.portfolioHint}>
              {userProjects.length} Projects • {userPosts.length} Posts
            </Text>
          </View>

          {(userProjects.length > 0 || userPosts.length > 0) ? (
            <View style={styles.gridContainer}>
              {/* Projects with briefcase indicator */}
              {userProjects.map((item) => {
                const publicPhotos = item.publicImages || item.images || [];
                const thumb = publicPhotos.length > 0 ? publicPhotos[0] : null;

                return (
                  <TouchableOpacity
                    key={`project-${item.id}`}
                    style={styles.gridItem}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedProject({ ...item, displayImages: publicPhotos });
                      setActiveSlide(0);
                    }}
                  >
                    {thumb ? (
                      <Image
                        source={{ uri: thumb }}
                        style={styles.gridImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.gridImage, styles.gridPlaceholder]}>
                        <Ionicons name="image-outline" size={22} color="#334155" />
                      </View>
                    )}
                    {/* Project indicator badge */}
                    <View style={styles.projectBadge}>
                      <Ionicons name="briefcase" size={12} color="#fff" />
                    </View>
                    {publicPhotos.length > 1 && (
                      <View style={styles.multiIndicator}>
                        <Ionicons name="copy" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Posts (no badge, just the hammer icon if has works) */}
              {userPosts.map((item) => {
                const thumb = item.images && item.images.length > 0 ? item.images[0] : null;

                return (
                  <TouchableOpacity
                    key={`post-${item.id}`}
                    style={styles.gridItem}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedPost(item);
                      setActiveSlide(0);
                    }}
                  >
                    {thumb ? (
                      <Image
                        source={{ uri: thumb }}
                        style={styles.gridImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.gridImage, styles.gridPlaceholder]}>
                        <Ionicons name="image-outline" size={22} color="#334155" />
                      </View>
                    )}
                    {item.worksCount > 0 && (
                      <View style={styles.worksIndicator}>
                        <Ionicons name="hammer" size={10} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginLeft: 2 }}>
                          {item.worksCount}
                        </Text>
                      </View>
                    )}
                    {item.images && item.images.length > 1 && (
                      <View style={styles.multiIndicator}>
                        <Ionicons name="copy" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyPortfolio}>
              <Ionicons name="images-outline" size={40} color="#334155" />
              <Text style={styles.emptyText}>No public content shared yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL (Instagram style) */}
      <Modal visible={!!selectedProject} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          {/* Tap outside closes */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />

          <View style={styles.modalContent}>
            {/* Carousel */}
            <View style={styles.carouselFrame}>
              {selectedProject?.displayImages && selectedProject.displayImages.length > 0 ? (
                <View>
                  <FlatList
                    data={selectedProject.displayImages}
                    renderItem={renderCarouselItem}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    removeClippedSubviews
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    decelerationRate="fast"
                    bounces={false}
                    overScrollMode="never"
                    getItemLayout={(_, index) => ({
                      length: modalWidth,
                      offset: modalWidth * index,
                      index,
                    })}
                  />

                  {/* Dots */}
                  {selectedProject.displayImages.length > 1 && (
                    <View style={styles.paginationContainer}>
                      {selectedProject.displayImages.map((_: any, i: number) => (
                        <View
                          key={i}
                          style={[
                            styles.paginationDot,
                            { backgroundColor: i === activeSlide ? '#3b82f6' : 'rgba(255,255,255,0.8)' },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.carouselEmpty}>
                  <Ionicons name="image-outline" size={60} color="#94a3b8" />
                </View>
              )}
            </View>

            {/* Body */}
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>{selectedProject?.name || 'Untitled'}</Text>

              <Text style={styles.modalSubtitle}>
                Built by: <Text style={styles.modalStrong}>{profile?.full_name || 'Unknown'}</Text>
              </Text>

              {selectedProject?.createdAt?.toDate && (
                <View style={styles.modalMetaRow}>
                  <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                  <Text style={styles.modalMetaText}>{selectedProject.createdAt.toDate().toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}