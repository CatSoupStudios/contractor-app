import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusBadge } from './StatusBadge';

type EstimateStatus = 'draft' | 'waiting' | 'approved' | 'rejected';

interface EstimateCardProps {
    estimateNumber: string;
    status: EstimateStatus;
    total: number;
    createdAt: Date;
    itemCount: number;
    onPress: () => void;
}

export function EstimateCard({
    estimateNumber,
    status,
    total,
    createdAt,
    itemCount,
    onPress
}: EstimateCardProps) {
    const { currentTheme: theme } = useTheme();
    const COLORS = theme.colors;
    const styles = useMemo(() => getStyles(theme), [theme]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.numberContainer}>
                    <Ionicons name="document-text" size={18} color={COLORS.primary} />
                    <Text style={styles.estimateNumber}>{estimateNumber}</Text>
                </View>
                <StatusBadge status={status} size="small" />
            </View>

            <View style={styles.body}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.footerItem}>
                    <Ionicons name="layers-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.footerText}>{itemCount} items</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.footerText}>{formatDate(createdAt)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
            </View>
        </TouchableOpacity>
    );
}

const getStyles = (theme: any) => {
    const { colors: COLORS, spacing: SPACING, radius: RADIUS, fontSizes: FONT_SIZES, glass: GLASS } = theme;
    return StyleSheet.create({
        container: {
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.m,
            padding: SPACING.m,
            marginBottom: SPACING.s,
            borderWidth: 1,
            borderColor: COLORS.border,
            ...GLASS?.card,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.m,
        },
        numberContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.s,
        },
        estimateNumber: {
            color: COLORS.text,
            fontSize: FONT_SIZES.m,
            fontWeight: '600',
        },
        body: {
            marginBottom: SPACING.m,
        },
        totalLabel: {
            color: COLORS.textMuted,
            fontSize: FONT_SIZES.xs,
            marginBottom: 2,
        },
        totalAmount: {
            color: COLORS.text,
            fontSize: FONT_SIZES.xxl,
            fontWeight: '700',
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: SPACING.m,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
        },
        footerItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.xs,
            marginRight: SPACING.l,
        },
        footerText: {
            color: COLORS.textMuted,
            fontSize: FONT_SIZES.xs,
        },
    });
};
