import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';

interface LineItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
}

interface LineItemRowProps {
    item: LineItem;
    onEdit?: () => void;
    onDelete?: () => void;
    editable?: boolean;
}

export function LineItemRow({ item, onEdit, onDelete, editable = true }: LineItemRowProps) {
    const total = item.quantity * item.unitPrice;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.mainInfo}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    {item.description && (
                        <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                    )}
                </View>

                <View style={styles.details}>
                    <Text style={styles.quantity}>
                        {item.quantity} {item.unit || 'x'} @ {formatCurrency(item.unitPrice)}
                    </Text>
                    <Text style={styles.total}>{formatCurrency(total)}</Text>
                </View>
            </View>

            {editable && (
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                            <Ionicons name="pencil" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
                            <Ionicons name="trash" size={16} color={COLORS.accent} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.s,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    content: {
        flex: 1,
    },
    mainInfo: {
        marginBottom: SPACING.xs,
    },
    name: {
        color: COLORS.text,
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
    },
    description: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.xs,
        marginTop: 2,
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantity: {
        color: COLORS.textDim,
        fontSize: FONT_SIZES.xs,
    },
    total: {
        color: COLORS.secondary,
        fontSize: FONT_SIZES.m,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        marginLeft: SPACING.m,
        gap: SPACING.xs,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.xs,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
});
