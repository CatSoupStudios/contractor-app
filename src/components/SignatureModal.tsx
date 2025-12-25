import React, { useRef, useEffect } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { COLORS_WARM as COLORS, SPACING, RADIUS, FONT_SIZES, GRADIENTS_WARM as GRADIENTS } from '../theme/DesignSystem';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';

interface SignatureModalProps {
    visible: boolean;
    onClose: () => void;
    onOK: (signature: string) => void;
}

export function SignatureModal({ visible, onClose, onOK }: SignatureModalProps) {
    const ref = useRef<SignatureViewRef>(null);

    useEffect(() => {
        // We handle rotation to landscape in onShow of Modal
        // We only handle rotation back to portrait here when the modal becomes hidden
        if (!visible) {
            rotateToPortrait();
        }
    }, [visible]);

    const rotateToLandscape = async () => {
        try {
            // Small delay to allow Modal transition to start/finish
            await new Promise(resolve => setTimeout(resolve, 100));
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch (e) {
            console.log('Error locking landscape:', e);
        }
    };

    const rotateToPortrait = async () => {
        try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (e) {
            console.log('Error locking portrait:', e);
        }
    };

    const handleOK = (signature: string) => {
        // Just call onOK, the useEffect will handle orientation back to portrait
        // or we do it here but let's avoid double calls
        onOK(signature);
    };

    const handleClear = () => {
        ref.current?.clearSignature();
    };

    const handleUndo = () => {
        ref.current?.undo();
    };

    const style = `.m-signature-pad--footer {display: none; height: 0px;} body,html {height: 100%;}`;

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onShow={() => rotateToLandscape()}>
            {visible && (
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Digital Signature</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.canvasContainer}>
                        <SignatureScreen
                            ref={ref}
                            onOK={handleOK}
                            descriptionText="Sign here to accept terms"
                            clearText="Clear"
                            confirmText="Save"
                            webStyle={style}
                            autoClear={false}
                            imageType="image/png"
                        />
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleClear}>
                            <Ionicons name="refresh" size={20} color={COLORS.text} />
                            <Text style={styles.secondaryBtnText}>Clear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleUndo}>
                            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                            <Text style={styles.secondaryBtnText}>Undo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.primaryBtn} onPress={() => ref.current?.readSignature()}>
                            <LinearGradient
                                colors={GRADIENTS.primary as [string, string]}
                                style={styles.gradientBtn}
                            >
                                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                                <Text style={styles.primaryBtnText}>Save Signature</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hint}>
                        By signing above, you agree to the terms and conditions outlined in this estimate.
                    </Text>
                </View>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingHorizontal: SPACING.l,
        paddingBottom: SPACING.m,
        backgroundColor: COLORS.surface,
    },
    closeBtn: {
        padding: SPACING.s,
    },
    title: {
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
        color: COLORS.text,
    },
    canvasContainer: {
        flex: 1,
        margin: SPACING.l,
        borderRadius: RADIUS.l,
        borderWidth: 2,
        borderColor: COLORS.border,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        paddingBottom: 40,
        gap: SPACING.s,
    },
    secondaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.m,
        paddingVertical: SPACING.m,
        gap: SPACING.xs,
    },
    secondaryBtnText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 11, // Reduced to prevent overflow
    },
    primaryBtn: {
        flex: 1.5, // Give more space to the primary action
        borderRadius: RADIUS.m,
        overflow: 'hidden',
    },
    gradientBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.m,
        gap: SPACING.xs,
    },
    primaryBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 13, // Adjusted size
    },
    hint: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: 11,
        paddingHorizontal: SPACING.xl,
        paddingBottom: 20,
        lineHeight: 16,
    },
});
