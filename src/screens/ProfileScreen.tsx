import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, ActivityIndicator, ScrollView,
  TouchableOpacity, StatusBar, Alert, Modal,
  Dimensions, FlatList, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  getFirestore, doc, updateDoc, collection,
  query, where, orderBy, limit, getCountFromServer, onSnapshot
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../services/cloudinary';
import { SPACING } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { DopamineButton } from '../components/DopamineButton';
import { createStyles, modalWidth, CAROUSEL_HEIGHT } from '../styles/ProfileScreen.styles';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const { currentTheme: theme, isDark } = useTheme();
  const COLORS = theme.colors;
  const GRADIENTS = theme.gradients;
  const GLASS = theme.glass;
  const styles = useMemo(() => createStyles(COLORS, GLASS), [COLORS, GLASS]);

  const navigation = useNavigation<any>();

  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'projects' | 'posts'>('projects');

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const db = getFirestore();
  const user = auth.currentUser;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: true,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index);
    }
  }).current;

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const profileRef = doc(db, "profiles", user.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.log("Profile listener error:", error);
    });

    const fetchCount = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const qCount = query(projectsRef, where("userId", "==", user.uid));
        const countSnapshot = await getCountFromServer(qCount);
        setProjectCount(countSnapshot.data().count);
      } catch (e) { }
    };
    fetchCount();

    const projectsRef = collection(db, "projects");
    const qProjects = query(
      projectsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(9)
    );

    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projectsData = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((p: any) => p.status !== 'archived'); // Hide archived from profile
      setProjects(projectsData);
      setProjectCount(projectsData.length);
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.log("Projects listener error:", error);
      setLoading(false);
    });

    // Listen for user's posts - Real-time listener for worksCount updates
    const postsRef = collection(db, "posts");
    const qPosts = query(
      postsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(12)
    );

    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const postsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(postsData);
      console.log(`[PROFILE] Updated ${postsData.length} posts with real-time listener`);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.log("Posts listener error:", error);
    });

    return () => {
      unsubProfile();
      unsubProjects();
      unsubPosts();
    };

  }, [db, user]);

  // Self-Correction: Sync counters on load to ensure accuracy
  useEffect(() => {
    const syncCounters = async () => {
      if (!user || !profile) return;

      try {
        // 1. Get Real Counts
        const crewRef = collection(db, "profiles", user.uid, "crew");
        const followersRef = collection(db, "followers", user.uid, "list");

        const [crewSnap, followersSnap] = await Promise.all([
          getCountFromServer(crewRef),
          getCountFromServer(followersRef)
        ]);

        const realFollowing = crewSnap.data().count;
        const realFollowers = followersSnap.data().count;

        // 2. Compare with Profile Data
        const currentFollowing = profile.followingCount || 0;
        const currentFollowers = profile.followersCount || 0;

        // 3. Update if mismatched
        if (realFollowing !== currentFollowing || realFollowers !== currentFollowers) {
          console.log("Syncing counters...", { realFollowers, realFollowing });
          const profileRef = doc(db, "profiles", user.uid);
          await updateDoc(profileRef, {
            followingCount: realFollowing,
            followersCount: realFollowers
          });
        }
      } catch (error) {
        console.log("Counter sync error:", error);
      }
    };

    if (profile) {
      syncCounters();
    }
  }, [profile?.full_name]); // Run once when profile loads/changes slightly, avoid infinite loop on count update
  const handlePickImage = async (type: 'photoUrl' | 'coverUrl') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Denied', 'We need access to your gallery.');
    }

    const aspect: [number, number] = type === 'photoUrl' ? [1, 1] : [16, 9];

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: aspect,
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploading(true);
      const imageUrl = await uploadToCloudinary(result.assets[0].uri);

      if (imageUrl && user) {
        try {
          await updateDoc(doc(db, "profiles", user.uid), { [type]: imageUrl });
          Alert.alert("Success", "Image updated!");
        } catch (err) {
          Alert.alert('Error', 'Failed to update database.');
        }
      }
      setUploading(false);
    }
  };

  const closeModal = () => {
    setSelectedProject(null);
    setActiveSlide(0);
  };

  const renderCarouselItem = useCallback(({ item }: { item: string }) => (
    <View style={{ width: modalWidth, height: CAROUSEL_HEIGHT, overflow: 'hidden' }}>
      <Image
        source={{ uri: item }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />
    </View>
  ), []);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* COVER */}
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

          <TouchableOpacity
            style={styles.coverEditButton}
            onPress={() => handlePickImage('coverUrl')}
            disabled={uploading}
          >
            <Ionicons name="camera" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <SafeAreaView style={styles.headerButtons}>
            <View />
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={[styles.settingsButton, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>

          {/* PROFILE INFO */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {uploading ? (
                <View style={[styles.avatar, styles.avatarLoading]}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              ) : profile?.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.avatar} contentFit="cover" transition={500} />
              ) : (
                <LinearGradient
                  colors={GRADIENTS.accent as [string, string]}
                  style={[styles.avatar, styles.avatarPlaceholder]}
                >
                  <Text style={styles.initials}>
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </LinearGradient>
              )}

              <TouchableOpacity
                style={styles.avatarEditButton}
                onPress={() => handlePickImage('photoUrl')}
                disabled={uploading}
              >
                <LinearGradient
                  colors={GRADIENTS.accent as [string, string]}
                  style={styles.avatarEditGradient}
                >
                  <Ionicons name="pencil" size={14} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>{profile?.full_name || 'User Name'}</Text>

            <Text style={styles.bioText}>
              {profile?.specialty || 'Contractor'} • {profile?.company_name || 'My Company'} • @{profile?.userTag || '000000'}
            </Text>

            {/* STATS */}
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{projectCount}</Text>
                <Text style={styles.statLabel}>Projects</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.followersCount || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* CONTENT TABS */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'projects' && styles.contentTabActive]}
            onPress={() => setActiveTab('projects')}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={activeTab === 'projects' ? COLORS.white : COLORS.textMuted}
            />
            <Text style={[styles.contentTabText, activeTab === 'projects' && styles.contentTabTextActive]}>
              Portfolio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contentTab, activeTab === 'posts' && styles.contentTabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="hammer-outline"
              size={18}
              color={activeTab === 'posts' ? COLORS.white : COLORS.textMuted}
            />
            <Text style={[styles.contentTabText, activeTab === 'posts' && styles.contentTabTextActive]}>
              Posts
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* PORTFOLIO / POSTS CONTENT */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.portfolioSection}>
          {activeTab === 'projects' ? (
            <>
              <View style={styles.portfolioHeader}>
                <View style={styles.portfolioTitleRow}>
                  <Ionicons name="briefcase-outline" size={20} color={COLORS.text} />
                  <Text style={styles.portfolioTitle}>Projects ({projectCount})</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AddProject')}>
                  <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {projects.length > 0 ? (
                <View style={styles.gridContainer}>
                  {projects.map((item, index) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInDown.delay(index * 100).springify()}
                    >
                      <TouchableOpacity
                        style={styles.gridItem}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedProject(item);
                          setActiveSlide(0);
                        }}
                      >
                        {item.images && item.images.length > 0 ? (
                          <Image source={{ uri: item.images[0] }} style={styles.gridImage} contentFit="cover" />
                        ) : (
                          <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
                            <Ionicons name="image-outline" size={24} color={COLORS.textDim} />
                          </View>
                        )}
                        {item.images && item.images.length > 1 && (
                          <View style={styles.multipleIndicator}>
                            <Ionicons name="copy" size={14} color={COLORS.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <GlassCard style={styles.emptyPortfolio}>
                  <Ionicons name="camera-outline" size={40} color={COLORS.textDim} />
                  <Text style={styles.emptyText}>No projects yet</Text>
                  <DopamineButton
                    title="Add Project"
                    variant="gradient"
                    onPress={() => navigation.navigate('AddProject')}
                    style={styles.addProjectButton}
                    size="small"
                    icon={<Ionicons name="add" size={18} color={COLORS.white} />}
                  />
                </GlassCard>
              )}
            </>
          ) : (
            <>
              <View style={styles.portfolioHeader}>
                <View style={styles.portfolioTitleRow}>
                  <Ionicons name="hammer-outline" size={20} color={COLORS.text} />
                  <Text style={styles.portfolioTitle}>Posts ({posts.length})</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
                  <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {posts.length > 0 ? (
                <View style={styles.gridContainer}>
                  {posts.map((item, index) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInDown.delay(index * 100).springify()}
                    >
                      <TouchableOpacity
                        style={styles.gridItem}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedPost(item);
                          setActiveSlide(0);
                        }}
                      >
                        {item.images && item.images.length > 0 ? (
                          <Image source={{ uri: item.images[0] }} style={styles.gridImage} contentFit="cover" />
                        ) : (
                          <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
                            <Ionicons name="image-outline" size={24} color={COLORS.textDim} />
                          </View>
                        )}
                        {item.images && item.images.length > 1 && (
                          <View style={styles.multipleIndicator}>
                            <Ionicons name="copy" size={14} color={COLORS.white} />
                          </View>
                        )}
                        {/* WORKS indicator */}
                        {item.worksCount > 0 && (
                          <View style={[styles.multipleIndicator, { left: SPACING.xs, right: 'auto' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                              <Ionicons name="hammer" size={12} color={COLORS.white} />
                              <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: '600' }}>
                                {item.worksCount}
                              </Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <GlassCard style={styles.emptyPortfolio}>
                  <Ionicons name="hammer-outline" size={40} color={COLORS.textDim} />
                  <Text style={styles.emptyText}>No posts yet</Text>
                  <DopamineButton
                    title="Create Post"
                    variant="gradient"
                    onPress={() => navigation.navigate('CreatePost')}
                    style={styles.addProjectButton}
                    size="small"
                    icon={<Ionicons name="hammer" size={18} color={COLORS.white} />}
                  />
                </GlassCard>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* PROJECT MODAL - Premium Dopamine Style */}
      <Modal
        visible={!!selectedProject}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          {/* Blur/dim background tap to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeModal}
          />

          <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
            {/* Close button - floating */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
              <View style={styles.modalCloseBtnInner}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </View>
            </TouchableOpacity>

            {/* Image carousel */}
            <View style={styles.modalImageContainer}>
              {selectedProject?.images && selectedProject.images.length > 0 ? (
                <View>
                  <FlatList
                    data={selectedProject.images}
                    renderItem={renderCarouselItem}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    removeClippedSubviews={true}
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

                  {/* Pagination dots */}
                  {selectedProject.images.length > 1 && (
                    <View style={styles.paginationContainer}>
                      {selectedProject.images.map((_: any, i: number) => (
                        <View
                          key={i}
                          style={[
                            styles.paginationDot,
                            {
                              backgroundColor: i === activeSlide ? COLORS.primary : 'rgba(255,255,255,0.4)',
                              width: i === activeSlide ? 20 : 8,
                            }
                          ]}
                        />
                      ))}
                    </View>
                  )}

                  {/* Image counter badge */}
                  <View style={styles.imageCountBadge}>
                    <Ionicons name="images" size={12} color={COLORS.white} />
                    <Text style={styles.imageCountText}>
                      {activeSlide + 1}/{selectedProject.images.length}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.modalImagePlaceholder}>
                  <LinearGradient
                    colors={['rgba(59,130,246,0.1)', 'rgba(129,140,248,0.1)']}
                    style={styles.modalImagePlaceholderGradient}
                  >
                    <Ionicons name="image-outline" size={60} color={COLORS.textDim} />
                    <Text style={styles.noImagesText}>No images</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Project details - Glass card */}
            <View style={styles.modalBody}>
              {/* Title with gradient accent */}
              <View style={styles.modalTitleRow}>
                <LinearGradient
                  colors={GRADIENTS.accent as [string, string]}
                  style={styles.modalTitleAccent}
                />
                <Text style={styles.modalTitle}>{selectedProject?.name || 'Untitled Project'}</Text>
              </View>

              {/* Info row */}
              <View style={styles.modalInfoRow}>
                <View style={styles.modalInfoItem}>
                  <Ionicons name="person-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.modalInfoText}>
                    {selectedProject?.client || 'Private Client'}
                  </Text>
                </View>
                <View style={styles.modalInfoDivider} />
                <View style={styles.modalInfoItem}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.modalInfoText}>
                    {selectedProject?.createdAt?.toDate
                      ? new Date(selectedProject.createdAt.toDate()).toLocaleDateString()
                      : 'Recent'}
                  </Text>
                </View>
              </View>

              {/* View full project button */}
              <TouchableOpacity
                style={styles.modalViewBtn}
                onPress={() => {
                  closeModal();
                  navigation.navigate('ProjectDetails', { projectId: selectedProject.id });
                }}
              >
                <Text style={styles.modalViewBtnText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}