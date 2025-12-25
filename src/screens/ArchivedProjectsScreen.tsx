import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from 'firebase/firestore';

import { auth } from '../services/firebase';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';
import { useTheme } from '../theme/ThemeContext';

export default function ArchivedProjectsScreen() {
    const { currentTheme: theme, isDark } = useTheme();
    const COLORS = theme.colors;

    const navigation = useNavigation<any>();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const db = getFirestore();
    const user = auth.currentUser;

    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const fetchArchivedProjects = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const projectsRef = collection(db, 'projects');
            const q = query(
                projectsRef,
                where('userId', '==', user.uid),
                where('status', '==', 'archived'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(list);
        } catch (error) {
            console.error("Error fetching archived projects:", error);
        } finally {
            setLoading(false);
        }
    }, [user, db]);

    useEffect(() => {
        fetchArchivedProjects();
    }, [fetchArchivedProjects]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.projectItem}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
        >
            <View style={styles.projectIcon}>
                <Ionicons name="archive" size={24} color={COLORS.textDim} />
            </View>
            <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{item.name || 'Untitled Project'}</Text>
                <Text style={styles.projectClient}>{item.client || 'No Client'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
        </TouchableOpacity>
    ), [styles, COLORS, navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Archived Projects</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : projects.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="archive-outline" size={64} color={COLORS.surfaceHighlight} />
                        <Text style={styles.emptyText}>No archived projects found.</Text>
                    </View>
                ) : (
                    <FlatList
                        key={isDark ? 'dark' : 'light'}
                        data={projects}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const createStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
        color: COLORS.text,
    },
    listContent: {
        padding: SPACING.m,
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    projectIcon: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.s,
        backgroundColor: COLORS.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    projectInfo: {
        flex: 1,
    },
    projectName: {
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
        color: COLORS.text,
    },
    projectClient: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    emptyText: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textDim,
        marginTop: SPACING.m,
        textAlign: 'center',
    },
});
