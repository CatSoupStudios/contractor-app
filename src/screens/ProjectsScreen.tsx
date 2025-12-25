import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions,
  RefreshControl,
  Modal,
  Alert,
  Linking,
  ScrollView,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { getOptimizedImageUrl } from '../services/cloudinary';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { getStyles } from '../styles/ProjectsScreen.styles';

interface Project {
  id: string;
  name: string;
  client: string;
  userId: string;
  images: string[];
  thumbnailUrl?: string;
  visibility?: 'public' | 'private';
  createdAt?: any;
  status?: string;
}

const BATCH_SIZE = 12;
const VIEW_MODE_KEY = '@contractor_app_project_view_mode';

const { width, height } = Dimensions.get('window');

export default function ProjectsScreen() {
  const { currentTheme: theme, isDark } = useTheme();
  const COLORS = theme.colors;
  const GRADIENTS = theme.gradients;
  const GLASS = theme.glass;

  // Constants
  const CARD_HEIGHT = height * 0.55;
  const GRID_SPACING = SPACING.s;
  const GRID_PADDING = SPACING.m;
  const GRID_ITEM_WIDTH = (width - (GRID_PADDING * 2) - GRID_SPACING) / 2;
  const GRID_ITEM_HEIGHT = GRID_ITEM_WIDTH * 1.3;

  const styles = useMemo(() => getStyles({
    ...theme,
    COLORS,
    SPACING,
    RADIUS,
    FONT_SIZES,
    GRADIENTS,
    GLASS,
    CARD_HEIGHT,
    GRID_SPACING,
    GRID_PADDING,
    GRID_ITEM_WIDTH,
    GRID_ITEM_HEIGHT
  }), [theme]);

  const navigation = useNavigation<any>();
  const db = getFirestore();
  const user = auth.currentUser;

  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Clients
  const [clients, setClients] = useState<any[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const getClientsStorageKey = () => `@contractor_app_clients_${user?.uid || 'default'}`;

  // Format date helper
  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'Recently';
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Load saved clients from local storage (per user)
  const fetchClients = async () => {
    if (!user) return;
    try {
      const stored = await AsyncStorage.getItem(getClientsStorageKey());
      if (stored) {
        setClients(JSON.parse(stored));
      } else {
        setClients([]); // Clear clients if no data for this user
      }
    } catch (e) {
      console.log('Error loading clients from storage:', e);
    }
  };

  useEffect(() => {
    fetchClients();
    loadViewMode();
  }, []);

  const loadViewMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(VIEW_MODE_KEY);
      if (savedMode === 'carousel' || savedMode === 'grid') {
        setViewMode(savedMode);
      }
    } catch (e) {
      console.log('Error loading view mode:', e);
    }
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === 'carousel' ? 'grid' : 'carousel';
    setViewMode(newMode);
    try {
      await AsyncStorage.setItem(VIEW_MODE_KEY, newMode);
    } catch (e) {
      console.log('Error saving view mode:', e);
    }
  };

  // Client handlers
  const handleAddClient = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission Denied', 'Contact access is needed to add clients.');
      }
      setLoadingClients(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      setLoadingClients(false);
      if (data.length === 0) {
        return Alert.alert('No Contacts', 'No contacts found on this device.');
      }
      const contactList = data
        .filter(c => c.name)
        .map(c => ({
          id: c.id,
          name: c.name || 'Unknown',
          phone: c.phoneNumbers?.[0]?.number || '',
          email: c.emails?.[0]?.email || '',
        }));
      setShowClientModal(false);
      setPhoneContacts(contactList);
      setTimeout(() => setShowContactPicker(true), 100);
    } catch (error) {
      setLoadingClients(false);
      Alert.alert('Error', 'Could not load contacts. Please try again.');
    }
  };

  const saveClient = async (contact: { name: string; phone: string; email: string }) => {
    setLoadingClients(true);
    try {
      const newClient = {
        id: Date.now().toString(),
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        createdAt: new Date().toISOString(),
      };
      const updatedClients = [...clients, newClient];
      await AsyncStorage.setItem(getClientsStorageKey(), JSON.stringify(updatedClients));
      setClients(updatedClients);
      setShowContactPicker(false);
      Alert.alert('Added!', `${contact.name} has been added to your clients.`);
    } catch (e) {
      Alert.alert('Error', 'Could not save client.');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    Alert.alert('Delete Client', `Remove ${clientName} from your clients?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedClients = clients.filter(c => c.id !== clientId);
            await AsyncStorage.setItem(getClientsStorageKey(), JSON.stringify(updatedClients));
            setClients(updatedClients);
          } catch (e) {
            Alert.alert('Error', 'Could not delete client.');
          }
        },
      },
    ]);
  };

  const handleCallClient = (phone: string) => {
    if (!phone) return Alert.alert('No Phone', 'This client has no phone number.');
    Linking.openURL(`tel:${phone}`);
  };

  const handleCreateEstimateForClient = (client: { name: string; phone: string }) => {
    setShowClientModal(false);
    navigation.navigate('AddProject', { clientName: client.name, clientPhone: client.phone });
  };

  // Fetch projects
  const fetchProjects = useCallback(async (loadMore = false) => {
    if (!user) return;
    if (loadMore && !hasMore) return;

    if (!loadMore) {
      setLoading(true);
      lastDocRef.current = null;
    }

    try {
      const projectsRef = collection(db, 'projects');
      let constraints: any[] = [
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(BATCH_SIZE)
      ];

      if (loadMore && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current));
      }

      const q = query(projectsRef, ...constraints);
      const snapshot = await getDocs(q);

      const newProjects = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project))
        .filter(p => p.status !== 'archived');

      if (loadMore) {
        setProjects(prev => [...prev, ...newProjects]);
      } else {
        setProjects(newProjects);
        setCurrentIndex(0);
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      if (lastVisible) lastDocRef.current = lastVisible;
      setHasMore(snapshot.docs.length === BATCH_SIZE);

    } catch (error: any) {
      if (error.code !== 'permission-denied') {
        console.log("Error fetching projects:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, hasMore, db]);

  useFocusEffect(
    useCallback(() => {
      fetchProjects(false);
    }, [fetchProjects])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects(false);
  };

  // Render Card Content Helper
  const renderCardContent = (project: Project, index: number, total: number) => (
    <TouchableOpacity
      activeOpacity={0.95}
      style={{ flex: 1 }}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: project.id })}
    >
      {/* Card Background Image */}
      <View style={styles.cardImageContainer}>
        {project?.images?.[0] || project?.thumbnailUrl ? (
          <Image
            source={{ uri: getOptimizedImageUrl(project.thumbnailUrl || project.images[0]) }}
            style={styles.cardImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority={viewMode === 'carousel' ? 'high' : 'normal'}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            placeholderContentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.05)']} // Subtle overlay on pastel
            style={styles.cardImagePlaceholder}
          >
            <Ionicons name="image-outline" size={viewMode === 'carousel' ? 60 : 40} color="rgba(0,0,0,0.1)" />
          </LinearGradient>
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.cardOverlay}
        />

        {/* Status Badge */}
        {project?.visibility === 'public' && (
          <View style={[styles.statusBadge, viewMode === 'grid' && { top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 3 }]}>
            <View style={styles.statusDot} />
            {viewMode === 'carousel' && <Text style={styles.statusText}>Public</Text>}
          </View>
        )}

        {/* Project Info */}
        <View style={[styles.cardInfo, viewMode === 'grid' && { bottom: 8, left: 8, right: 8 }]}>
          <Text
            style={[styles.projectName, viewMode === 'grid' && { fontSize: FONT_SIZES.m }]}
            numberOfLines={1}
          >
            {project?.name || 'Project'}
          </Text>
          <Text style={[styles.projectClient, viewMode === 'grid' && { fontSize: FONT_SIZES.s }]} numberOfLines={1}>
            {project?.client || 'No client'}
          </Text>
        </View>

        {/* Image Count */}
        {project?.images?.length > 1 && (
          <View style={[styles.imageCount, viewMode === 'grid' && { top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 3 }]}>
            <Ionicons name="images" size={viewMode === 'grid' ? 10 : 14} color={COLORS.white} />
            <Text style={[styles.imageCountText, viewMode === 'grid' && { fontSize: 10 }]}>{project.images.length}</Text>
          </View>
        )}
      </View>

      {/* Card Footer - Only for Carousel */}
      {viewMode === 'carousel' && (
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{formatDate(project?.createdAt)}</Text>
          <View style={styles.cardPagination}>
            <Text style={styles.paginationText}>
              {index + 1} / {total}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render Item for FlatList
  const renderItem = useCallback(({ item, index }: { item: Project; index: number }) => {
    if (viewMode === 'grid') {
      return (
        <View style={[styles.gridItemContainer, index % 2 === 0 && { marginRight: GRID_SPACING }]}>
          <View style={styles.gridProjectCardShadow}>
            <View style={styles.gridProjectCardContent}>
              {renderCardContent(item, index, projects.length)}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={{ width: width, paddingHorizontal: SPACING.l, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.projectCardShadow}>
          <View style={styles.projectCardContent}>
            {renderCardContent(item, index, projects.length)}
          </View>
        </View>
      </View>
    );
  }, [projects.length, viewMode, styles, theme]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Viewability config for FlatList
  const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

  if (loading && projects.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {/* Left - Stats Badge */}
          <View style={styles.statsBadge}>
            <Ionicons name="folder" size={16} color={COLORS.primary} />
            <Text style={styles.statsText}>{projects.length}</Text>
          </View>

          {/* Center - Title */}
          <Text style={styles.headerTitle}>Projects</Text>

          {/* Right - View Toggle Button */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={toggleViewMode}
          >
            <Ionicons
              name={viewMode === 'carousel' ? 'grid-outline' : 'albums-outline'}
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Main Card Area */}
        <View style={[styles.cardArea, viewMode === 'grid' && { paddingHorizontal: GRID_PADDING }]}>
          {projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="folder-open-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Projects Yet</Text>
              <Text style={styles.emptySubtitle}>Tap the + button to create your first project</Text>
            </View>
          ) : (
            <FlatList
              key={`${viewMode}-${isDark}`} // Force re-render when switching modes or theme
              data={projects}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              horizontal={viewMode === 'carousel'}
              numColumns={viewMode === 'grid' ? 2 : 1}
              pagingEnabled={viewMode === 'carousel'}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={viewMode === 'carousel' ? onViewableItemsChanged : undefined}
              viewabilityConfig={viewabilityConfig}
              contentContainerStyle={viewMode === 'carousel' ? { alignItems: 'center', paddingVertical: 24 } : { paddingBottom: 100 }}
              columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'center', marginBottom: GRID_SPACING } : undefined}
              decelerationRate={viewMode === 'carousel' ? 0 : 'fast'}
              snapToAlignment="center"
              initialNumToRender={viewMode === 'grid' ? 6 : 2}
              maxToRenderPerBatch={viewMode === 'grid' ? 6 : 2}
              windowSize={3}
              // Remove conflicting snapToInterval when pagingEnabled is true
              snapToInterval={undefined}
              style={{ width: width, overflow: 'visible' }} // Explicit full width
            />
          )}

          {/* Swipe hint - Only for Carousel */}
          {projects.length > 1 && viewMode === 'carousel' && (
            <View style={styles.swipeHint}>
              <Ionicons name="swap-horizontal" size={16} color={COLORS.textMuted} />
              <Text style={styles.swipeHintText}>Swipe to browse</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Archive/Finished Projects Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('ArchivedProjects')}
          >
            <Ionicons name="archive-outline" size={22} color={COLORS.textDim} />
          </TouchableOpacity>

          {/* People/Clients Button - Electric Blue Tint */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => setShowClientModal(true)}
          >
            <Ionicons name="people" size={24} color="#4F46E5" />
          </TouchableOpacity>

          {/* Add Project Button (Main) - Dark Blue */}
          <TouchableOpacity
            style={styles.actionButtonMain}
            onPress={() => navigation.navigate('AddProject')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primary] as [string, string]}
              style={styles.actionButtonMainGradient}
            >
              <Ionicons name="add" size={32} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('CompanySettings')}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* CLIENTS MODAL */}
      <Modal visible={showClientModal} animationType="slide" transparent>
        <View style={styles.clientModalOverlay}>
          <View style={styles.clientModalContainer}>
            <View style={styles.clientModalHeader}>
              <Text style={styles.clientModalTitle}>My Clients</Text>
              <TouchableOpacity onPress={() => setShowClientModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {clients.length === 0 ? (
              <View style={styles.clientsEmpty}>
                <Ionicons name="people-outline" size={40} color={COLORS.textDim} />
                <Text style={styles.clientsEmptyText}>No clients saved yet</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {clients.map((item) => (
                  <View key={item.id} style={styles.clientItem}>
                    <LinearGradient
                      colors={['#4F46E5', '#3B82F6'] as [string, string]}
                      style={styles.clientAvatar}
                    >
                      <Text style={styles.clientAvatarText}>
                        {item.name?.charAt(0)?.toUpperCase() || 'C'}
                      </Text>
                    </LinearGradient>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{item.name}</Text>
                      <Text style={styles.clientPhone}>{item.phone || item.email || 'No contact'}</Text>
                    </View>
                    <View style={styles.clientActions}>
                      <TouchableOpacity
                        onPress={() => handleCallClient(item.phone)}
                        style={styles.clientActionBtn}
                      >
                        <Ionicons name="call-outline" size={18} color={COLORS.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleCreateEstimateForClient({ name: item.name, phone: item.phone })}
                        style={styles.clientActionBtn}
                      >
                        <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteClient(item.id, item.name)}
                        style={styles.clientActionBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity onPress={handleAddClient} disabled={loadingClients}>
              <LinearGradient
                colors={GRADIENTS.primary as [string, string]}
                style={styles.addClientBtn}
              >
                {loadingClients ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="person-add" size={18} color={COLORS.white} />
                    <Text style={styles.addClientBtnText}>Add from Contacts</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONTACTS PICKER MODAL */}
      <Modal visible={showContactPicker} animationType="slide" transparent>
        <View style={styles.clientModalOverlay}>
          <View style={[styles.clientModalContainer, { maxHeight: '80%' }]}>
            <View style={styles.clientModalHeader}>
              <Text style={styles.clientModalTitle}>Select Contact ({phoneContacts.length})</Text>
              <TouchableOpacity onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {phoneContacts.map((item, index) => (
                <TouchableOpacity
                  key={item.id || `contact-${index}`}
                  style={styles.clientItem}
                  onPress={() => saveClient(item)}
                >
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {item.name?.charAt(0)?.toUpperCase() || 'C'}
                    </Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <Text style={styles.clientPhone}>{item.phone || item.email || 'No contact'}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

