import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
  Keyboard, TouchableWithoutFeedback, Alert, StyleSheet, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeOut, Layout, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import {
  getFirestore, collection, query, getDocs, where, orderBy,
  limit, doc, setDoc, deleteDoc, onSnapshot, increment, updateDoc, addDoc, serverTimestamp,
  writeBatch, getDoc
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { Image } from 'expo-image';
import { SPACING } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { createStyles } from '../styles/TeamScreen.styles';

export default function TeamScreen() {
  const { currentTheme: theme, isDark } = useTheme();
  const COLORS = theme.colors;
  const GRADIENTS = theme.gradients;
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [myCrew, setMyCrew] = useState<any[]>([]);
  const [myFollowers, setMyFollowers] = useState<any[]>([]);
  const [pendingFollowBacks, setPendingFollowBacks] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [ignoredUsers, setIgnoredUsers] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'crew' | 'messages' | 'pending'>('crew');
  const [loading, setLoading] = useState(false);
  const [loadingCrew, setLoadingCrew] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const db = getFirestore();
  const currentUser = auth.currentUser;

  // Listen for CREW (Who I follow)
  useEffect(() => {
    if (!currentUser) return;
    const crewRef = collection(db, "profiles", currentUser.uid, "crew");
    const unsubscribe = onSnapshot(crewRef, (snapshot) => {
      const crewList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyCrew(crewList);
    });
    return () => unsubscribe();
  }, []);

  // Listen for CHATS
  useEffect(() => {
    if (!currentUser) return;
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherId = data.participants.find((p: string) => p !== currentUser.uid);
        return {
          id: doc.id,
          otherUserId: otherId,
          otherUserName: data.p_names?.[otherId] || 'Contractor',
          otherUserPhoto: data.p_photos?.[otherId] || null,
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt,
          unreadCount: data.unreadCount?.[currentUser.uid] || 0,
        };
      });
      setChats(chatList);
    }, (err) => {
      console.log("Listen for chats error:", err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for FOLLOWERS (Who follows me)
  useEffect(() => {
    if (!currentUser) return;
    const followersRef = collection(db, "followers", currentUser.uid, "list");
    const unsubscribe = onSnapshot(followersRef, (snapshot) => {
      const followersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyFollowers(followersList);
    });
    return () => unsubscribe();
  }, []);

  // Listen for IGNORED SUGGESTIONS
  useEffect(() => {
    if (!currentUser) return;
    const ignoredRef = collection(db, "profiles", currentUser.uid, "ignored_suggestions");
    const unsubscribe = onSnapshot(ignoredRef, (snapshot) => {
      const data: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const ts = doc.data().at;
        if (ts && ts.toMillis) {
          data[doc.id] = ts.toMillis();
        } else if (ts && ts.seconds) {
          data[doc.id] = ts.seconds * 1000;
        } else {
          data[doc.id] = Date.now();
        }
      });
      setIgnoredUsers(data);
    }, (error) => {
      console.log("Ignored Suggestions Permission Error:", error.code);
      setIgnoredUsers({});
    });
    return () => unsubscribe();
  }, []);

  // Compute Pending Follow Backs
  useEffect(() => {
    if (loadingCrew) {
      setLoadingCrew(false);
    }
    const pending = myFollowers.filter(follower => {
      if (myCrew.some(crewMember => crewMember.id === follower.id)) return false;
      const ignoredAt = ignoredUsers[follower.id];
      if (!ignoredAt) return true;
      const followerAddedAt = follower.addedAt ? new Date(follower.addedAt).getTime() : 0;
      return followerAddedAt > ignoredAt;
    });
    setPendingFollowBacks(pending);
  }, [myCrew, myFollowers, ignoredUsers]);

  useEffect(() => {
    if (searchText.length === 6) {
      handleSearchUser();
    } else {
      setSearchResults([]);
    }
  }, [searchText]);

  // Sync search bar visibility with keyboard
  useEffect(() => {
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      // Only close if search is visible and input is empty (manual cleanup)
      if (isSearchVisible && searchText.length === 0) {
        dismissSearch();
      }
    });
    return () => hideSubscription.remove();
  }, [isSearchVisible]);

  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setSearchText(numericText);
  };

  const handleSearchUser = async () => {
    if (searchText.length !== 6) return;
    try {
      setLoading(true);
      const q = query(collection(db, "profiles"), where("userTag", "==", searchText));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const foundUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        if (foundUser.id !== currentUser?.uid) {
          setSearchResults([foundUser]);
        } else {
          setSearchResults([]);
        }
      } else {
        Alert.alert("User not found", "No user found with this ID Tag.");
        setSearchResults([]);
      }
    } catch (error) {
      console.log("Error searching user:", error);
      Alert.alert("Error", "Failed to search user");
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (user: any, isFollowing: boolean) => {
    if (!currentUser) return;

    const myCrewRef = doc(db, "profiles", currentUser.uid, "crew", user.id);
    const theirFollowersRef = doc(db, "followers", user.id, "list", currentUser.uid);
    const myProfileRef = doc(db, "profiles", currentUser.uid);
    const theirProfileRef = doc(db, "profiles", user.id);

    try {
      const batch = writeBatch(db);

      if (isFollowing) {
        batch.delete(myCrewRef);
        batch.delete(theirFollowersRef);
        batch.update(myProfileRef, { followingCount: increment(-1) });
        batch.update(theirProfileRef, { followersCount: increment(-1) });
        await batch.commit();

        try {
          const ignoredRef = doc(db, "profiles", currentUser.uid, "ignored_suggestions", user.id);
          await setDoc(ignoredRef, { at: serverTimestamp() });
        } catch (ignoreErr) {
          console.log("Failed to mark as ignored:", ignoreErr);
        }

      } else {
        const followData = {
          full_name: user.full_name || 'Worker',
          userTag: user.userTag || '0000',
          photoUrl: user.photoUrl || null,
          company_name: user.company_name || null,
          specialty: user.specialty || 'General',
          addedAt: new Date().toISOString()
        };
        batch.set(myCrewRef, followData);

        let myData = { full_name: 'User', photoUrl: null, userTag: '000000' } as any;
        const myDataSnap = await getDoc(myProfileRef);
        if (myDataSnap.exists()) {
          myData = myDataSnap.data();
        }

        batch.set(theirFollowersRef, {
          full_name: myData.full_name || 'User',
          userTag: myData.userTag || '0000',
          photoUrl: myData.photoUrl || null,
          addedAt: new Date().toISOString()
        });

        batch.update(myProfileRef, { followingCount: increment(1) });
        batch.update(theirProfileRef, { followersCount: increment(1) });

        const notifRef = doc(collection(db, "notifications", user.id, "items"));
        batch.set(notifRef, {
          type: 'follow',
          fromUserId: currentUser.uid,
          fromUserName: myData.full_name || 'User',
          fromUserPhoto: myData.photoUrl || null,
          message: `${myData.full_name || 'Someone'} started following you`,
          read: false,
          createdAt: serverTimestamp(),
        });

        await batch.commit();

        try {
          const ignoredRef = doc(db, "profiles", currentUser.uid, "ignored_suggestions", user.id);
          await deleteDoc(ignoredRef);
        } catch (ignoreErr) {
          console.log("Failed to un-ignore:", ignoreErr);
        }
      }
    } catch (error) {
      console.log('Toggle follow error:', error);
      Alert.alert("Error", "Could not update follow status");
    }
  };

  const dismissSearch = () => {
    if (isSearchVisible) {
      setIsSearchVisible(false);
      setSearchText('');
      setSearchResults([]);
      Keyboard.dismiss();
    }
  };

  const toggleSearch = () => {
    if (isSearchVisible) {
      dismissSearch();
    } else {
      setIsSearchVisible(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const formatName = (fullName: string) => {
    if (!fullName) return 'Worker';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  };

  const handleRemoveFollower = async (user: any) => {
    if (!currentUser) return;

    Alert.alert(
      "Remove Follower",
      `Are you sure you want to remove ${user.full_name || 'this user'} from your followers?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              const myFollowerRef = doc(db, "followers", currentUser.uid, "list", user.id);
              batch.delete(myFollowerRef);

              const meInTheirCrewRef = doc(db, "profiles", user.id, "crew", currentUser.uid);
              batch.delete(meInTheirCrewRef);

              const myProfileRef = doc(db, "profiles", currentUser.uid);
              const theirProfileRef = doc(db, "profiles", user.id);

              batch.update(myProfileRef, { followersCount: increment(-1) });
              batch.update(theirProfileRef, { followingCount: increment(-1) });

              await batch.commit();
            } catch (e) {
              console.log("Error removing follower:", e);
              Alert.alert("Error", "Could not remove follower.");
            }
          }
        }
      ]
    );
  };

  const renderChatItem = ({ item, index }: { item: any; index: number }) => {
    const date = item.lastMessageAt?.toDate ? item.lastMessageAt.toDate() : new Date();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity
          style={styles.chatRow}
          onPress={() => navigation.navigate('Chat', {
            chatId: item.id,
            otherUserId: item.otherUserId,
            otherUserName: item.otherUserName,
            otherUserPhoto: item.otherUserPhoto
          })}
        >
          <Image
            source={{ uri: item.otherUserPhoto }}
            style={styles.chatAvatar}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.chatInfo}>
            <Text style={styles.chatName} numberOfLines={1}>{item.otherUserName}</Text>
            <Text style={styles.chatLastMsg} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
          <View style={styles.chatMeta}>
            <Text style={styles.chatTime}>{time}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCrewMember = ({ item, index }: { item: any; index: number }) => {
    const isFollowing = myCrew.some(c => c.id === item.id);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40).springify()}
        style={styles.gridItem}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PublicProfile', {
            userId: item.id,
            isFollowing: isFollowing
          })}
        >
          <View style={[styles.crewCard, isFollowing && styles.activeCrewCard]}>
            <View style={styles.gridStatus}>
              {activeTab === 'pending' ? (
                <TouchableOpacity onPress={() => handleRemoveFollower(item)}>
                  <Ionicons name="close-circle" size={18} color={COLORS.accent} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => toggleFollow(item, isFollowing)}>
                  <Ionicons
                    name={isFollowing ? "people" : "add-circle"}
                    size={22}
                    color={isFollowing ? COLORS.secondary : COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {item.photoUrl ? (
              <Image
                source={{ uri: item.photoUrl }}
                style={styles.crewAvatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <LinearGradient
                colors={GRADIENTS.primary as [string, string]}
                style={styles.crewAvatar}
              >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700' }}>
                    {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              </LinearGradient>
            )}

            <Text style={styles.crewName} numberOfLines={1}>{formatName(item.full_name)}</Text>
            <Text style={styles.crewTag} numberOfLines={1}>@{item.userTag}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <TouchableWithoutFeedback onPress={dismissSearch} accessible={false}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={{ flex: 1 }}>
            <View style={styles.content}>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>My Crew</Text>
                  <TouchableOpacity
                    style={styles.searchToggle}
                    onPress={toggleSearch}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSearchVisible ? "close" : "search"}
                      size={22}
                      color={isSearchVisible ? COLORS.accent : COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Find and manage your team</Text>
              </View>

              {/* Search Bar */}
              {isSearchVisible && (
                <View style={styles.searchCard}>
                  <View style={styles.searchContent}>
                    <Text style={styles.atSymbol}>@</Text>
                    <TextInput
                      ref={searchInputRef}
                      style={styles.searchInput}
                      placeholder="000000"
                      placeholderTextColor={COLORS.textDim}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={searchText}
                      onChangeText={handleTextChange}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity
                        onPress={() => { setSearchText(''); setSearchResults([]); }}
                        style={styles.clearButton}
                      >
                        <Ionicons name="close-circle" size={22} color={COLORS.textDim} />
                      </TouchableOpacity>
                    )}
                    {loading && <ActivityIndicator color={COLORS.primary} size="small" style={{ marginLeft: 8 }} />}
                  </View>
                </View>
              )}

              {/* Results Section */}
              <View style={styles.listSection}>
                {searchResults.length > 0 ? (
                  <View style={{ flex: 1 }}>
                    <View style={styles.crewHeader}>
                      <Text style={styles.crewLabel}>Search Result</Text>
                    </View>
                    <FlatList
                      key="search-grid"
                      data={searchResults}
                      keyExtractor={item => item.id}
                      renderItem={renderCrewMember}
                      numColumns={3}
                      columnWrapperStyle={{ gap: SPACING.s }}
                      contentContainerStyle={styles.listContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    {/* TABS */}
                    <View style={styles.tabContainer}>
                      <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'crew' && styles.activeTabButton]}
                        onPress={() => setActiveTab('crew')}
                      >
                        <Text style={[styles.tabText, activeTab === 'crew' && styles.activeTabText]}>My Crew</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'messages' && styles.activeTabButton]}
                        onPress={() => setActiveTab('messages')}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>Messages</Text>
                          {chats.filter(c => c.unreadCount > 0).length > 0 && (
                            <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
                              <Text style={styles.badgeText}>{chats.filter(c => c.unreadCount > 0).length}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
                        onPress={() => setActiveTab('pending')}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
                          {pendingFollowBacks.length > 0 && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{pendingFollowBacks.length}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.crewHeader}>
                      <Text style={styles.crewLabel}>
                        {activeTab === 'crew' ? 'Your Team' : activeTab === 'messages' ? 'Recent Chats' : 'Pending Requests'}
                      </Text>
                      {activeTab === 'crew' && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{myCrew.length}</Text>
                        </View>
                      )}
                    </View>

                    {/* LIST */}
                    <FlatList
                      key={`${activeTab}-${isDark}`}
                      data={activeTab === 'crew' ? myCrew : activeTab === 'pending' ? pendingFollowBacks : chats}
                      renderItem={activeTab === 'messages' ? renderChatItem : renderCrewMember}
                      keyExtractor={item => item.id}
                      numColumns={activeTab === 'messages' ? 1 : 3}
                      columnWrapperStyle={activeTab === 'messages' ? undefined : { gap: SPACING.s }}
                      contentContainerStyle={styles.listContent}
                      showsVerticalScrollIndicator={false}
                      ListEmptyComponent={
                        <View style={styles.emptyState}>
                          <Ionicons
                            name={activeTab === 'crew' ? "people-outline" : activeTab === 'messages' ? "chatbubbles-outline" : "mail-open-outline"}
                            size={48}
                            color={COLORS.textDim}
                          />
                          <Text style={styles.emptyTitle}>
                            {activeTab === 'crew' ? 'Your crew is empty' : activeTab === 'messages' ? 'No messages yet' : 'No pending requests'}
                          </Text>
                          <Text style={styles.emptySubtitle}>
                            {activeTab === 'crew'
                              ? 'Search by @ID above to add team members'
                              : activeTab === 'messages' ? 'Start a conversation with your crew' : "You're all caught up!"}
                          </Text>
                        </View>
                      }
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  );
}