import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    Keyboard, TouchableWithoutFeedback, StyleSheet, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import {
    getFirestore, collection, addDoc, query,
    orderBy, onSnapshot, serverTimestamp, doc,
    updateDoc, increment, setDoc, getDoc
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from '../styles/ChatScreen.styles';
import DotPattern from '../components/DotPattern';

export default function ChatScreen() {
    const { currentTheme: theme, isDark } = useTheme();
    const COLORS = theme.colors;
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { chatId: initialChatId, otherUserId, otherUserName, otherUserPhoto } = route.params;

    const [chatId, setChatId] = useState(initialChatId);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [otherUser, setOtherUser] = useState<any>({
        full_name: otherUserName,
        photoUrl: otherUserPhoto
    });

    // Track if the other user follows me (for message limit)
    const [otherFollowsMe, setOtherFollowsMe] = useState<boolean | null>(null); // null = loading
    const [myMessageCount, setMyMessageCount] = useState(0);
    const [chatExists, setChatExists] = useState(false); // Track if chat has been created
    const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger re-fetch after sending first message

    const db = getFirestore();
    const currentUser = auth.currentUser;
    const flatListRef = useRef<FlatList>(null);

    // Detect keyboard visibility
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // 1. Generate Chat ID if not provided (coming from Profile)
    useEffect(() => {
        if (!chatId && currentUser && otherUserId) {
            const ids = [currentUser.uid, otherUserId].sort();
            setChatId(`${ids[0]}_${ids[1]}`);
        }
    }, [initialChatId, otherUserId, currentUser]);

    // 2. Fetch/Verify other user info if missing
    useEffect(() => {
        if (otherUserId && !otherUserName) {
            const fetchOtherUser = async () => {
                const snap = await getDoc(doc(db, "profiles", otherUserId));
                if (snap.exists()) {
                    setOtherUser(snap.data());
                }
            };
            fetchOtherUser();
        }
    }, [otherUserId]);

    // 3. Check if the other user follows me (for message limit)
    useEffect(() => {
        if (!currentUser || !otherUserId) return;

        const checkIfFollowsMe = async () => {
            try {
                // Check if otherUserId exists in my followers list
                const followerRef = doc(db, "followers", currentUser.uid, "list", otherUserId);
                const snap = await getDoc(followerRef);
                const follows = snap.exists();
                setOtherFollowsMe(follows);
            } catch (e) {
                console.log("Error checking follower status:", e);
                setOtherFollowsMe(false);
            }
        };
        checkIfFollowsMe();
    }, [currentUser, otherUserId]);

    // 4. Listen for Messages
    useEffect(() => {
        if (!chatId || !currentUser) {
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let isMounted = true;

        const setupListener = async () => {
            // First check if the chat document exists
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (!isMounted) return;

            if (!chatSnap.exists()) {
                // Chat doesn't exist yet, that's fine for new conversations
                setLoading(false);
                setMessages([]);
                setChatExists(false);
                return;
            }

            setChatExists(true);

            // Chat exists, set up the listener
            const messagesRef = collection(db, "chats", chatId, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (!isMounted) return;
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMessages(msgs);
                setLoading(false);

                // Count how many messages I've sent (for non-follower limit)
                if (currentUser) {
                    const myMsgs = msgs.filter((m: any) => m.senderId === currentUser.uid);
                    setMyMessageCount(myMsgs.length);
                }

                // Mark as read when messages arrive and I am the receiver
                markAsRead();
            }, (err) => {
                setLoading(false);
            });
        };

        setupListener();

        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [chatId, currentUser, refreshTrigger]);

    // 4. Mark messages as read
    const markAsRead = async () => {
        if (!chatId || !currentUser) return;
        try {
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);
            if (chatSnap.exists()) {
                const data = chatSnap.data();
                const isParticipant = data.participants?.includes(currentUser.uid);
                if (isParticipant && data.unreadCount && data.unreadCount[currentUser.uid] > 0) {
                    await updateDoc(chatRef, {
                        [`unreadCount.${currentUser.uid}`]: 0
                    });
                }
            }
        } catch (e: any) {
            // Keep it silent if it's a permission issue on a new chat
            if (!e.message?.includes('permission-denied')) {
                console.log("Error marking as read:", e);
            }
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !currentUser || !chatId || !otherUserId) return;

        // Check if blocked by message limit (non-follower sent 1 msg already)
        // Only block if we confirmed they DON'T follow (otherFollowsMe === false, not null)
        if (otherFollowsMe === false && myMessageCount >= 1) {
            return; // Blocked, do nothing
        }

        const text = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            // Create chat head if doesn't exist
            if (!chatSnap.exists()) {
                const mySnap = await getDoc(doc(db, "profiles", currentUser.uid));
                const myData = mySnap.data() || {};

                await setDoc(chatRef, {
                    participants: [currentUser.uid, otherUserId],
                    p_names: {
                        [currentUser.uid]: myData.full_name || 'User',
                        [otherUserId]: otherUser.full_name || 'Contractor'
                    },
                    p_photos: {
                        [currentUser.uid]: myData.photoUrl || null,
                        [otherUserId]: otherUser.photoUrl || null
                    },
                    lastMessage: text,
                    lastMessageAt: serverTimestamp(),
                    unreadCount: {
                        [currentUser.uid]: 0,
                        [otherUserId]: 1
                    }
                });

                // Trigger listener re-subscription now that chat exists
                setRefreshTrigger(prev => prev + 1);
            } else {
                // Update existing chat head
                await updateDoc(chatRef, {
                    lastMessage: text,
                    lastMessageAt: serverTimestamp(),
                    [`unreadCount.${otherUserId}`]: increment(1)
                });
            }

            // Add actual message
            await addDoc(collection(db, "chats", chatId, "messages"), {
                text,
                senderId: currentUser.uid,
                createdAt: serverTimestamp()
            });

        } catch (e) {
            console.log("Error sending message:", e);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.senderId === currentUser?.uid;
        const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[
                styles.messageWrapper,
                isMe ? styles.myMessageWrapper : styles.otherMessageWrapper
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.myMessageBubble : styles.otherMessageBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isMe ? styles.myMessageText : styles.otherMessageText
                    ]}>
                        {item.text}
                    </Text>
                </View>
                <Text style={[styles.timeText, isMe && styles.myTimeText]}>{time}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            {/* Header */}
            <View style={styles.header}>
                <SafeAreaView edges={['top']} />
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Image
                            source={{ uri: otherUser.photoUrl }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                        <View>
                            <Text style={styles.name}>{otherUser.full_name || 'Loading...'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Content Area with Pattern */}
            <View style={styles.contentArea}>
                {/* Dot pattern background */}
                <DotPattern />

                {loading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={60} color={COLORS.textDim} />
                                <Text style={styles.emptyText}>
                                    Start a conversation with {otherUser.full_name || 'this contractor'}.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Message Limit Warning Banner */}
            {otherFollowsMe === false && myMessageCount >= 1 && (
                <View style={styles.warningBanner}>
                    <Ionicons name="lock-closed-outline" size={16} color={COLORS.textDim} />
                    <Text style={styles.warningText}>
                        You can't send more messages until {otherUser.full_name || 'this person'} follows you.
                    </Text>
                </View>
            )}

            {/* Input Area (Bottom) */}
            <View style={[styles.inputWrapper, keyboardVisible && { paddingBottom: 8 }]}>
                <SafeAreaView edges={keyboardVisible ? [] : ['bottom']}>
                    <View style={styles.inputRow}>
                        <View style={[
                            styles.inputContainer,
                            (otherFollowsMe === false && myMessageCount >= 1) && { opacity: 0.5 }
                        ]}>
                            <TextInput
                                style={styles.input}
                                placeholder={(otherFollowsMe === false && myMessageCount >= 1) ? "Waiting for follow..." : "Message"}
                                placeholderTextColor={COLORS.textDim}
                                multiline
                                value={inputText}
                                onChangeText={setInputText}
                                textAlignVertical="center"
                                editable={otherFollowsMe !== false || myMessageCount < 1}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim() || sending || (otherFollowsMe === false && myMessageCount >= 1)}
                            style={[
                                styles.sendButton,
                                (!inputText.trim() || sending || (otherFollowsMe === false && myMessageCount >= 1)) && styles.sendButtonDisabled
                            ]}
                        >
                            <Ionicons name="arrow-up" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </KeyboardAvoidingView>
    );
}
