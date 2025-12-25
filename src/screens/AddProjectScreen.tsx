import React, { useCallback, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../services/cloudinary';
import { auth } from '../services/firebase';
import { useTheme } from '../theme/ThemeContext';
import { getStyles } from '../styles/AddProjectScreen.styles';

interface JobItem {
  id: string;
  label: string;
  photoUri?: string;
  photoUrl?: string;
  isUploading?: boolean;
}

export default function AddProjectScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { currentTheme: theme } = useTheme();
  const COLORS = theme.colors;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemLayouts = useRef<{ [key: string]: number }>({});
  const itemRefs = useRef<{ [key: string]: any }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Form fields
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');

  // Job items list
  const [jobItems, setJobItems] = useState<JobItem[]>([
    { id: '1', label: '' }
  ]);

  // Pre-fill client info from route params (when coming from clients list)
  React.useEffect(() => {
    if (route.params?.clientName) {
      setClientName(route.params.clientName);
    }
    if (route.params?.clientPhone) {
      setClientPhone(route.params.clientPhone);
    }
  }, [route.params]);

  const isFormValid = projectName.trim() && clientName.trim() && jobItems.some(i => i.label.trim());

  const handleAddJobItem = () => {
    const newId = Date.now().toString();
    setJobItems([...jobItems, { id: newId, label: '' }]);

    // Auto-focus the new item after a short delay to allow it to render
    setTimeout(() => {
      // 550 is a rough estimate of the height above the job list section
      const y = (itemLayouts.current[newId] || 0) + 550;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
      itemRefs.current[newId]?.focus();
    }, 200);
  };

  const handleRemoveJobItem = (id: string) => {
    if (jobItems.length === 1) {
      setJobItems([{ id: '1', label: '' }]);
    } else {
      setJobItems(jobItems.filter(item => item.id !== id));
    }
  };

  const handleUpdateJobItem = (id: string, text: string) => {
    setJobItems(jobItems.map(item => item.id === id ? { ...item, label: text } : item));
  };

  const handlePickImage = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setJobItems(jobItems.map(item =>
        item.id === id ? { ...item, photoUri: result.assets[0].uri } : item
      ));
    }
  };

  const handleTakePhoto = async (id: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Denied', 'Camera access is required to take photos.');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setJobItems(jobItems.map(item =>
        item.id === id ? { ...item, photoUri: result.assets[0].uri } : item
      ));
    }
  };

  const generateShareToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleCreate = useCallback(async () => {
    if (!isFormValid) {
      return Alert.alert('Missing Info', 'Project name and client name are required.');
    }

    const user = auth.currentUser;
    if (!user) return Alert.alert('Session Error', 'Please login again.');

    setLoading(true);
    const db = getFirestore();

    try {
      // 1. Filter items that have either a label or a photo
      const validItems = jobItems.filter(item => item.label.trim() || item.photoUri);

      // 2. Upload photos for items that have them
      const itemsWithUrls = await Promise.all(validItems.map(async (item, idx) => {
        const finalLabel = item.label.trim() || `Job Item ${idx + 1}`;
        if (item.photoUri) {
          const url = await uploadToCloudinary(item.photoUri);
          return { label: finalLabel, photoUrl: url };
        }
        return { label: finalLabel };
      }));

      // 3. Save Project
      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        name: projectName.trim(),
        client: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientPhone: clientPhone.trim(),
        jobItems: itemsWithUrls,
        description: itemsWithUrls.map((it, idx) => `${idx + 1}. ${it.label} `).join('\n'), // Fallback text description
        address: address.trim(),
        images: itemsWithUrls.filter(it => it.photoUrl).map(it => it.photoUrl!), // Extract photos to main gallery too
        thumbnailUrl: itemsWithUrls.find(it => it.photoUrl)?.photoUrl || null,
        visibility: 'private',
        status: 'active',
        shareToken: generateShareToken(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setLoading(false);
      Alert.alert('Success', 'Project created! Now you can create an estimate.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.log('Error adding document: ', error);
      Alert.alert('Error', 'Could not save project.');
      setLoading(false);
    }
  }, [projectName, clientName, clientEmail, clientPhone, jobItems, address, navigation, isFormValid]);

  const scrollToInput = useCallback((y: number) => {
    // Add a small delay to ensure keyboard is up
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }, 100);
  }, []);

  const getInputStyle = (fieldName: string) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused,
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>New Project</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <Text style={styles.subtitle}>
          Enter your client's information. You can add photos and create estimates after.
        </Text>

        {/* PROJECT NAME */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            PROJECT NAME <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={getInputStyle('projectName')}
            placeholder="E.g., Kitchen Remodel, Deck Build..."
            placeholderTextColor={COLORS.textDim}
            value={projectName}
            onChangeText={setProjectName}
            onFocus={() => setFocusedField('projectName')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
          />
        </View>

        {/* CLIENT NAME */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            CLIENT NAME <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={getInputStyle('clientName')}
            placeholder="John Smith"
            placeholderTextColor={COLORS.textDim}
            value={clientName}
            onChangeText={setClientName}
            onFocus={() => setFocusedField('clientName')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
          />
        </View>

        {/* CLIENT EMAIL & PHONE ROW */}
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.label}>CLIENT EMAIL</Text>
            <TextInput
              style={getInputStyle('clientEmail')}
              placeholder="email@example.com"
              placeholderTextColor={COLORS.textDim}
              value={clientEmail}
              onChangeText={setClientEmail}
              onFocus={() => setFocusedField('clientEmail')}
              onBlur={() => setFocusedField(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.inputGroup, styles.inputHalf]}>
            <Text style={styles.label}>PHONE</Text>
            <TextInput
              style={getInputStyle('clientPhone')}
              placeholder="(555) 123-4567"
              placeholderTextColor={COLORS.textDim}
              value={clientPhone}
              onChangeText={setClientPhone}
              onFocus={() => setFocusedField('clientPhone')}
              onBlur={() => setFocusedField(null)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* ADDRESS */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>JOB ADDRESS</Text>
          <TextInput
            style={getInputStyle('address')}
            placeholder="123 Main St, City, State"
            placeholderTextColor={COLORS.textDim}
            value={address}
            onChangeText={setAddress}
            onFocus={() => setFocusedField('address')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
          />
        </View>

        {/* JOB DESCRIPTION ITEMS */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.label}>JOB DESCRIPTION LIST</Text>
            <TouchableOpacity onPress={handleAddJobItem} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 13 }}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {jobItems.map((item, index) => (
            <View
              key={item.id}
              style={styles.jobItemCard}
              onLayout={(e) => {
                // Capture layout Y relative to parent
                itemLayouts.current[item.id] = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.jobItemHeader}>
                <View style={styles.itemNumberBadge}>
                  <Text style={styles.itemNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  ref={(ref) => { itemRefs.current[item.id] = ref; }}
                  style={[styles.jobItemInput, focusedField === `item-${item.id}` && styles.inputFocused]}
                  placeholder="e.g. Paint kitchen cabinets"
                  placeholderTextColor={COLORS.textDim}
                  value={item.label}
                  onChangeText={(text) => handleUpdateJobItem(item.id, text)}
                  onFocus={(e) => {
                    setFocusedField(`item-${item.id}`);
                    const y = itemLayouts.current[item.id];
                    if (y !== undefined) {
                      scrollViewRef.current?.scrollTo({ y: (y + 550) - 100, animated: true });
                    }
                  }}
                  onBlur={() => setFocusedField(null)}
                  multiline
                />
                <TouchableOpacity onPress={() => handleRemoveJobItem(item.id)} style={styles.removeItemBtn}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.jobItemActions}>
                <TouchableOpacity style={styles.photoActionBtn} onPress={() => handleTakePhoto(item.id)}>
                  <Ionicons name="camera" size={18} color={COLORS.text} />
                  <Text style={styles.photoActionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionBtn} onPress={() => handlePickImage(item.id)}>
                  <Ionicons name="images" size={18} color={COLORS.text} />
                  <Text style={styles.photoActionText}>Gallery</Text>
                </TouchableOpacity>

                {item.photoUri && (
                  <View style={styles.photoPreview}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.photoPreviewText}>Photo Added</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* REAL-TIME PHOTO GALLERY */}
        <View style={styles.photoGallery}>
          <View style={styles.photoGalleryHeader}>
            <Text style={styles.photoGalleryTitle}>Project Photos Preview</Text>
            <Text style={styles.photoGalleryCount}>
              {jobItems.filter(i => i.photoUri).length} photos attached
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
            {jobItems.filter(i => i.photoUri).map((item, idx) => (
              <View key={`thumb-${item.id}`} style={styles.photoThumb}>
                <Image source={{ uri: item.photoUri }} style={styles.photoThumbImg} />
              </View>
            ))}
            {jobItems.filter(i => i.photoUri).length === 0 && (
              <View style={styles.photoThumbEmpty}>
                <Ionicons name="images-outline" size={24} color={COLORS.textDim} />
              </View>
            )}
          </ScrollView>
        </View>

        <Text style={styles.helperText}>
          <Ionicons name="information-circle" size={14} color={COLORS.textDim} /> Projects are private by default.
        </Text>

        {/* FOOTER - Moved Inside ScrollView */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
            style={[styles.createButton, {
              backgroundColor: COLORS.primary, // Force strong blue
              opacity: (!isFormValid || loading) ? 0.6 : 1
            }]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color={COLORS.white} />
                <Text style={styles.createButtonText}>Create Project</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}