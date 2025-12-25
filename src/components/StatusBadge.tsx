import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';

type EstimateStatus = 'draft' | 'waiting' | 'approved' | 'rejected';

interface StatusBadgeProps {
    status: EstimateStatus;
    size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG: Record<EstimateStatus, { label: string; bgColor: string; textColor: string }> = {
    draft: {
        label: 'Draft',
        bgColor: 'rgba(100, 116, 139, 0.2)',
        textColor: '#94A3B8',
    },
    waiting: {
        label: 'Waiting',
        bgColor: 'rgba(245, 158, 11, 0.2)',
        textColor: '#F59E0B',
    },
    approved: {
        label: 'Approved',
        bgColor: 'rgba(16, 185, 129, 0.2)',
        textColor: '#10B981',
    },
    rejected: {
        label: 'Rejected',
        bgColor: 'rgba(239, 68, 68, 0.2)',
        textColor: '#EF4444',
    },
};

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

    const sizeStyles = {
        small: { paddingH: SPACING.s, paddingV: 2, fontSize: 10 },
        medium: { paddingH: SPACING.m, paddingV: SPACING.xs, fontSize: FONT_SIZES.xs },
        large: { paddingH: SPACING.l, paddingV: SPACING.s, fontSize: FONT_SIZES.s },
    };

    const { paddingH, paddingV, fontSize } = sizeStyles[size];

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: config.bgColor,
                paddingHorizontal: paddingH,
                paddingVertical: paddingV,
            }
        ]}>
            <Text style={[styles.text, { color: config.textColor, fontSize }]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: RADIUS.full,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
