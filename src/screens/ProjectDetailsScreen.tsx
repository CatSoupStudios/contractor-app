import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  getFirestore,
  doc,
  onSnapshot,
  deleteDoc,
  collection,
  query,
  where,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { auth } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { EstimateCard } from '../components/EstimateCard';
import { useTheme } from '../theme/ThemeContext';
import { getStyles } from '../styles/ProjectDetailsScreen.styles';

type Visibility = 'public' | 'private';
type EstimateStatus = 'draft' | 'waiting' | 'approved' | 'rejected';

interface Estimate {
  id: string;
  estimateNumber: string;
  status: EstimateStatus;
  total: number;
  createdAt: any;
  items: any[];
}

export default function ProjectDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { currentTheme: theme } = useTheme();
  const COLORS = theme.colors;
  const GRADIENTS = theme.gradients;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const { projectId } = route.params;

  const [project, setProject] = useState<any>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo selection modal
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [selectedPublicPhotos, setSelectedPublicPhotos] = useState<string[]>([]);

  // Job Items toggle
  const [showAllJobItems, setShowAllJobItems] = useState(false);

  // Profit Tracker
  const [showCostModal, setShowCostModal] = useState(false);
  const [costName, setCostName] = useState('');
  const [costAmount, setCostAmount] = useState('');

  const db = getFirestore();
  const projectRef = useMemo(() => doc(db, 'projects', projectId), [db, projectId]);

  // Check if any estimate is approved
  const hasApprovedEstimate = estimates.some(e => e.status === 'approved');
  const images = project?.images || [];
  const publicImages = project?.publicImages || [];

  // Profit calculations
  const costs = project?.costs || [];
  const totalCosts = costs.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const estimateTotal = estimates.find(e => e.status === 'approved')?.total || estimates[0]?.total || 0;
  const profit = estimateTotal - totalCosts;
  const profitMargin = estimateTotal > 0 ? ((profit / estimateTotal) * 100).toFixed(1) : 0;

  // Fetch project
  useEffect(() => {
    const unsubscribe = onSnapshot(projectRef, (snap) => {
      if (isDeleting) return;
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as any;
        setProject(data);
        setSelectedPublicPhotos(data.publicImages || []);
      } else {
        if (!isDeleting) {
          navigation.goBack();
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [projectRef, isDeleting]);

  // Fetch estimates for this project
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const estimatesQuery = query(
      collection(db, 'estimates'),
      where('projectId', '==', projectId),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      estimatesQuery,
      (snap) => {
        const estimatesList: Estimate[] = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Estimate));
        estimatesList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setEstimates(estimatesList);
      },
      (error) => {
        console.log('Estimates query error:', error);
        setEstimates([]);
      }
    );

    return () => unsubscribe();
  }, [db, projectId]);

  // Toggle visibility with explanation
  const handleToggleVisibility = async () => {
    if (!project) return;
    const current = project.visibility ?? 'private';

    if (current === 'private') {
      // Going public - show explanation
      if (images.length === 0) {
        return Alert.alert(
          'No Photos',
          'Add photos to your project before making it public.'
        );
      }

      Alert.alert(
        'Make Project Public?',
        'When public, only your project name and selected photos will be visible on your profile.\n\nNo client info, estimates, or private data will be shown.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Select Photos & Publish',
            onPress: () => {
              // Open photo selector
              setSelectedPublicPhotos(publicImages.length > 0 ? publicImages : images);
              setShowPhotoSelector(true);
            }
          },
        ]
      );
    } else {
      // Going private
      Alert.alert(
        'Make Project Private?',
        'This project will no longer be visible on your public profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Make Private',
            onPress: async () => {
              try {
                await updateDoc(projectRef, { visibility: 'private' });
              } catch (e) {
                Alert.alert("Error", "Failed to update visibility");
              }
            }
          },
        ]
      );
    }
  };

  // Save public photos and make visible
  const handleSavePublicPhotos = async () => {
    if (selectedPublicPhotos.length === 0) {
      return Alert.alert('Select Photos', 'Please select at least one photo to show publicly.');
    }

    try {
      await updateDoc(projectRef, {
        visibility: 'public',
        publicImages: selectedPublicPhotos,
      });
      setShowPhotoSelector(false);
      Alert.alert('Published!', 'Your project is now visible on your profile with the selected photos.');
    } catch (e) {
      Alert.alert("Error", "Failed to update project");
    }
  };

  // Add cost to project
  const handleAddCost = async () => {
    if (!costName.trim() || !costAmount.trim()) {
      return Alert.alert('Missing Info', 'Please enter a cost name and amount.');
    }

    const newCost = {
      name: costName.trim(),
      amount: parseFloat(costAmount) || 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const currentCosts = project?.costs || [];
      await updateDoc(projectRef, {
        costs: [...currentCosts, newCost],
      });
      setCostName('');
      setCostAmount('');
      setShowCostModal(false);
    } catch (e) {
      Alert.alert("Error", "Failed to add cost");
    }
  };

  // Toggle photo selection
  const togglePhotoSelection = (uri: string) => {
    setSelectedPublicPhotos(prev => {
      if (prev.includes(uri)) {
        return prev.filter(p => p !== uri);
      } else {
        return [...prev, uri];
      }
    });
  };

  // Generate a secure share token
  const generateShareToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleShareProgress = async () => {
    if (!project) return;

    let token = project.shareToken;

    // Generate token if not exists
    if (!token) {
      token = generateShareToken();
      try {
        await updateDoc(projectRef, { shareToken: token });
      } catch (e) {
        return Alert.alert('Error', 'Could not generate share link.');
      }
    }

    const shareUrl = `https://contractorapp-5120d.web.app/project.html?projectId=${projectId}&t=${token}`;

    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Track the progress of our project "${project.name}" in real-time with Projectley: ${shareUrl}`,
        title: 'Project Progress Tracker'
      });
    } catch (error) {
      Alert.alert('Error', 'Could not open share menu.');
    }
  };

  // Select/deselect all photos
  const selectAllPhotos = () => setSelectedPublicPhotos([...images]);
  const deselectAllPhotos = () => setSelectedPublicPhotos([]);

  // Actions
  const handleDelete = () => {
    Alert.alert('Delete Project?', 'This will also delete all estimates. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setIsDeleting(true);
          await deleteDoc(projectRef);
          navigation.goBack();
        }
      }
    ]);
  };

  const handleFinishProject = async () => {
    if (!project) return;

    Alert.alert(
      "Finish Project?",
      "Links to the client tracker and estimates will be broken. This project will be archived without photos to keep it lightweight.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish & Archive",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await updateDoc(projectRef, {
                status: 'archived',
                isArchived: true,
                images: [], // Strip photos as requested (lightweight)
                publicImages: [], // Strip photos
                shareToken: null, // Break links permanently
                finishedAt: new Date().toISOString()
              });
              Alert.alert("Project Finished", "The project has been archived and links are now broken.");
              navigation.goBack();
            } catch (error) {
              console.error("Error finishing project:", error);
              Alert.alert("Error", "Could not finish project.");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddPhotos = async () => {
    if (!hasApprovedEstimate) {
      return Alert.alert(
        'Estimate Required',
        'You need an approved estimate before adding photos to this project.'
      );
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Gallery access needed.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUploading(true);
      try {
        const uploads = await Promise.all(result.assets.map(a => uploadToCloudinary(a.uri)));
        const validUrls = uploads.filter(u => u);
        if (validUrls.length > 0) {
          await updateDoc(projectRef, {
            images: arrayUnion(...validUrls),
            thumbnailUrl: project?.thumbnailUrl || validUrls[0],
          });
        }
      } catch (e) {
        Alert.alert("Error", "Upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleCreateEstimate = () => {
    // If estimates exist, edit the most recent one
    if (estimates.length > 0) {
      const latestEstimate = estimates[0]; // Already sorted by newest first
      navigation.navigate('CreateEstimate', {
        projectId,
        project,
        existingEstimate: latestEstimate // Pass for editing
      });
    } else {
      navigation.navigate('CreateEstimate', { projectId, project });
    }
  };

  const handleViewEstimate = (estimate: Estimate) => {
    navigation.navigate('EstimateDetails', { estimateId: estimate.id });
  };

  // Render
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const visibility: Visibility = project?.visibility ?? 'private';
  const isPublic = visibility === 'public';
  const isArchived = project?.status === 'archived';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PROJECT INFO CARD */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.projectCard}>
              {/* Project name with action icons */}
              <View style={styles.projectNameRow}>
                <Text style={styles.projectName}>{project?.name || "Untitled Project"}</Text>
                {!isArchived && (
                  <View style={styles.cardHeaderActions}>
                    <TouchableOpacity style={styles.cardActionBtn} onPress={handleShareProgress}>
                      <Ionicons name="share-social-outline" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.cardActionBtn, styles.cardDeleteBtn]} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.clientRow}>
                <Ionicons name="person" size={16} color={COLORS.textMuted} />
                <Text style={styles.clientName}>{project?.client || "No client"}</Text>
              </View>

              {project?.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={16} color={COLORS.textDim} />
                  <Text style={styles.addressText}>{project.address}</Text>
                </View>
              )}

              {project?.jobItems && project.jobItems.length > 0 ? (
                <View style={styles.jobItemsList}>
                  {(showAllJobItems ? project.jobItems : project.jobItems.slice(0, 3)).map((item: any, idx: number) => (
                    <View key={idx} style={styles.jobItemRow}>
                      <Text style={styles.jobItemNumber}>{idx + 1}.</Text>
                      <Text style={styles.jobItemLabel}>{item.label}</Text>
                      {item.photoUrl && (
                        <View style={styles.jobItemPhotoIcon}>
                          <Ionicons name="image-outline" size={14} color={COLORS.primary} />
                        </View>
                      )}
                    </View>
                  ))}

                  {project.jobItems.length > 3 && (
                    <TouchableOpacity
                      style={styles.viewMoreBtn}
                      onPress={() => setShowAllJobItems(!showAllJobItems)}
                    >
                      <Text style={styles.viewMoreText}>
                        {showAllJobItems ? 'View Less' : `View More (${project.jobItems.length - 3} more)`}
                      </Text>
                      <Ionicons
                        name={showAllJobItems ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                project?.description && (
                  <Text style={styles.descriptionText}>{project.description}</Text>
                )
              )}

              {/* VISIBILITY TOGGLE - Hide for archived */}
              {!isArchived && (
                <TouchableOpacity
                  style={[
                    styles.visibilityToggle,
                    isPublic && styles.visibilityTogglePublic
                  ]}
                  onPress={handleToggleVisibility}
                  activeOpacity={0.7}
                >
                  <View style={styles.visibilityToggleLeft}>
                    <Ionicons
                      name={isPublic ? "globe" : "lock-closed"}
                      size={18}
                      color={isPublic ? COLORS.secondary : COLORS.textMuted}
                    />
                    <View>
                      <Text style={[
                        styles.visibilityToggleText,
                        isPublic && styles.visibilityToggleTextPublic
                      ]}>
                        {isPublic ? 'Public' : 'Private'}
                      </Text>
                      <Text style={styles.visibilityToggleHint}>
                        {isPublic
                          ? `${publicImages.length} photos visible on profile`
                          : 'Tap to share on your profile'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textDim}
                  />
                </TouchableOpacity>
              )}

              {/* Edit public photos button when public (also hidden for archived) */}
              {isPublic && !isArchived && (
                <TouchableOpacity
                  style={styles.editPhotosBtn}
                  onPress={() => {
                    setSelectedPublicPhotos(publicImages);
                    setShowPhotoSelector(true);
                  }}
                >
                  <Ionicons name="images-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.editPhotosBtnText}>Edit Public Photos</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* CREATE/EDIT ESTIMATE BUTTON - Hide for archived projects */}
          {!isArchived && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <TouchableOpacity onPress={handleCreateEstimate} activeOpacity={0.8}>
                <LinearGradient
                  colors={estimates.length > 0 ? GRADIENTS.accent as [string, string] : GRADIENTS.primary as [string, string]}
                  style={styles.createEstimateBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons
                    name={estimates.length > 0 ? "create" : "document-text"}
                    size={22}
                    color={COLORS.white}
                  />
                  <Text style={styles.createEstimateText}>
                    {estimates.length > 0 ? 'Edit Estimate' : 'Create Estimate'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ESTIMATES SECTION */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Estimates</Text>
              {estimates.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{estimates.length}</Text>
                </View>
              )}
            </View>

            {estimates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="document-text-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No estimates yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first estimate to send to the client for approval.
                </Text>
              </View>
            ) : (
              estimates.map((estimate, index) => (
                <Animated.View
                  key={estimate.id}
                  entering={FadeIn.delay(100 * index)}
                >
                  <EstimateCard
                    estimateNumber={estimate.estimateNumber}
                    status={estimate.status}
                    total={estimate.total}
                    createdAt={estimate.createdAt?.toDate?.() || new Date()}
                    itemCount={estimate.items?.length || 0}
                    onPress={() => handleViewEstimate(estimate)}
                  />
                </Animated.View>
              ))
            )}
          </Animated.View>

          {/* PROFIT TRACKER SECTION - Hide for archived projects */}
          {estimates.length > 0 && !isArchived && (
            <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>💰 Profit Tracker (Private)</Text>
              </View>

              <TouchableOpacity
                style={styles.profitCard}
                onPress={() => setShowCostModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Estimate Total</Text>
                  <Text style={styles.profitValue}>${estimateTotal.toLocaleString()}</Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Total Costs ({costs.length})</Text>
                  <Text style={[styles.profitValue, { color: COLORS.accent }]}>-${totalCosts.toLocaleString()}</Text>
                </View>
                <View style={styles.profitDivider} />
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabelBold}>Net Profit</Text>
                  <Text style={[styles.profitValueBold, { color: profit >= 0 ? '#10B981' : COLORS.accent }]}>
                    ${profit.toLocaleString()} ({profitMargin}%)
                  </Text>
                </View>
                <View style={styles.profitTapHint}>
                  <Ionicons name="add-circle-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.profitTapHintText}>Tap to add/view costs</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* GALLERY SECTION - Hide for archived */}
          {!isArchived && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.gallerySection}>
              <View style={styles.galleryHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                {hasApprovedEstimate && (
                  <TouchableOpacity style={styles.addPhotosBtn} onPress={handleAddPhotos}>
                    <Ionicons name="add" size={16} color={COLORS.primary} />
                    <Text style={styles.addPhotosBtnText}>
                      {uploading ? 'Uploading...' : 'Add Photos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {(!hasApprovedEstimate && images.length === 0) ? (
                <View style={styles.lockedContainer}>
                  <View style={styles.lockedIconBg}>
                    <Ionicons name="lock-closed" size={28} color="#F59E0B" />
                  </View>
                  <Text style={styles.lockedTitle}>Photos Locked</Text>
                  <Text style={styles.lockedSubtitle}>
                    Progress photos can be added here after the estimate is approved.
                  </Text>
                </View>
              ) : images.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconBg}>
                    <Ionicons name="images-outline" size={36} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No photos yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Add progress photos and completed work to this project.
                  </Text>
                </View>
              ) : (
                <View style={styles.galleryGrid}>
                  {images.slice(0, 6).map((uri: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.galleryItem}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri }} style={styles.galleryImage} contentFit="cover" />
                      {index === 5 && images.length > 6 && (
                        <View style={styles.morePhotosOverlay}>
                          <Text style={styles.morePhotosText}>+{images.length - 6}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* FINISH PROJECT BUTTON - Hide for archived projects */}
          {!isArchived && (
            <Animated.View entering={FadeInDown.delay(450).springify()}>
              <TouchableOpacity
                onPress={handleFinishProject}
                activeOpacity={0.8}
                style={{ paddingBottom: 60 }} // Extra padding at bottom
              >
                <View style={styles.finishProjectBtn}>
                  <Ionicons name="checkmark-done-circle" size={24} color="#EF4444" />
                  <Text style={styles.finishProjectText}>Finish & Archive Project</Text>
                </View>
                <Text style={styles.finishHintText}>
                  Breaks all client links and archives info.
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView >

      {/* PHOTO SELECTOR MODAL */}
      < Modal visible={showPhotoSelector} animationType="slide" transparent >
        <View style={styles.modalOverlay}>
          <View style={styles.photoSelectorModal}>
            <View style={styles.photoSelectorHeader}>
              <Text style={styles.photoSelectorTitle}>Select Public Photos</Text>
              <TouchableOpacity onPress={() => setShowPhotoSelector(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.photoSelectorHint}>
              Only selected photos will be visible on your public profile.
            </Text>

            <View style={styles.photoSelectorActions}>
              <TouchableOpacity style={styles.photoSelectorActionBtn} onPress={selectAllPhotos}>
                <Text style={styles.photoSelectorActionText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoSelectorActionBtn} onPress={deselectAllPhotos}>
                <Text style={styles.photoSelectorActionText}>Deselect All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.photoSelectorGrid} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {images.map((uri: string, index: number) => {
                  const isSelected = selectedPublicPhotos.includes(uri);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.photoSelectorItem,
                        isSelected && styles.photoSelectorItemSelected
                      ]}
                      onPress={() => togglePhotoSelection(uri)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri }} style={styles.photoSelectorImage} contentFit="cover" />
                      <View style={[
                        styles.photoSelectorCheck,
                        isSelected && styles.photoSelectorCheckSelected
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.photoSelectorFooter}>
              <Text style={styles.photoSelectorCount}>
                {selectedPublicPhotos.length} of {images.length} selected
              </Text>
              <TouchableOpacity onPress={handleSavePublicPhotos}>
                <LinearGradient
                  colors={GRADIENTS.primary as [string, string]}
                  style={styles.photoSelectorSaveBtn}
                >
                  <Ionicons name="globe" size={18} color={COLORS.white} />
                  <Text style={styles.photoSelectorSaveBtnText}>Publish Project</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal >

      {/* ADD COST MODAL */}
      <Modal visible={showCostModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.photoSelectorOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.photoSelectorContainer}>
            <View style={styles.photoSelectorHeader}>
              <Text style={styles.photoSelectorTitle}>Project Costs</Text>
              <TouchableOpacity onPress={() => setShowCostModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Existing Costs List */}
            {costs.length > 0 && (
              <View style={styles.costsList}>
                {costs.map((cost: any, index: number) => (
                  <View key={index} style={styles.costItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.costName}>{cost.name}</Text>
                      {cost.notes && <Text style={styles.costNotes}>{cost.notes}</Text>}
                    </View>
                    <Text style={styles.costAmount}>-${cost.amount?.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Add New Cost Form */}
            <Text style={[styles.photoSelectorTitle, { fontSize: 14, marginTop: 16, marginBottom: 12 }]}>Add New Cost</Text>

            <TextInput
              style={styles.costInput}
              placeholder="Cost name (e.g., Materials, Labor)"
              placeholderTextColor={COLORS.textMuted}
              value={costName}
              onChangeText={setCostName}
            />
            <TextInput
              style={styles.costInput}
              placeholder="Amount"
              placeholderTextColor={COLORS.textMuted}
              value={costAmount}
              onChangeText={setCostAmount}
              keyboardType="numeric"
            />

            <TouchableOpacity onPress={handleAddCost}>
              <LinearGradient
                colors={GRADIENTS.primary as [string, string]}
                style={styles.photoSelectorSaveBtn}
              >
                <Ionicons name="add" size={18} color={COLORS.white} />
                <Text style={styles.photoSelectorSaveBtnText}>Add Cost</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}