import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getFirestore,
    doc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    getDoc,
} from 'firebase/firestore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { auth } from '../services/firebase';
import { COLORS, GRADIENTS, SPACING, RADIUS, FONT_SIZES } from '../theme/DesignSystem';
import { StatusBadge } from '../components/StatusBadge';
import { SignatureModal } from '../components/SignatureModal';
import { uploadToCloudinary } from '../services/cloudinary';
import { Image } from 'expo-image';
import { styles } from '../styles/EstimateDetailsScreen.styles';

type EstimateStatus = 'draft' | 'waiting' | 'approved' | 'rejected';

interface LineItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
}

export default function EstimateDetailsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { estimateId } = route.params;

    const [estimate, setEstimate] = useState<any>(null);
    const [companyProfile, setCompanyProfile] = useState<any>(null);
    const [projectStatus, setProjectStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const db = getFirestore();
    const user = auth.currentUser;
    const estimateRef = useMemo(() => doc(db, 'estimates', estimateId), [db, estimateId]);

    useEffect(() => {
        const unsubscribe = onSnapshot(estimateRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setEstimate({
                    id: snap.id,
                    ...data,
                    // Ensure critical arrays/fields exist
                    items: data.items || []
                });
            } else {
                navigation.goBack();
            }
            setLoading(false);
        }, (error) => {
            console.error('[DETAILS] Snapshot error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [estimateRef]);

    // Load company profile for PDF branding
    useEffect(() => {
        if (!user) return;

        const fetchCompanyProfile = async () => {
            try {
                const profileRef = doc(db, 'profiles', user.uid);
                const snap = await getDoc(profileRef);
                if (snap.exists()) {
                    setCompanyProfile(snap.data());
                }
            } catch (e) {
                console.log('Error loading company profile:', e);
            }
        };

        fetchCompanyProfile();
    }, [user, db]);

    // Fetch project status to check if archived
    useEffect(() => {
        if (!estimate?.projectId) return;
        const fetchProjectStatus = async () => {
            try {
                const projectRef = doc(db, 'projects', estimate.projectId);
                const snap = await getDoc(projectRef);
                if (snap.exists()) {
                    setProjectStatus(snap.data()?.status || null);
                }
            } catch (e) {
                console.log('Error fetching project status:', e);
            }
        };
        fetchProjectStatus();
    }, [estimate?.projectId, db]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount || 0);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            if (isNaN(date.getTime())) return 'Pending...';
            return new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }).format(date);
        } catch (e) {
            return 'Pending...';
        }
    };

    const getStatusColor = (status: EstimateStatus) => {
        switch (status) {
            case 'approved': return '#10B981';
            case 'waiting': return '#F59E0B';
            case 'rejected': return '#EF4444';
            default: return '#64748B';
        }
    };

    const handleApprove = async () => {
        Alert.alert(
            'Mark as Approved?',
            'This will unlock photos for this project.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await updateDoc(estimateRef, {
                                status: 'approved',
                                approvedAt: serverTimestamp(),
                            });
                            Alert.alert('Approved!', 'The estimate has been approved.');
                        } catch (error) {
                            Alert.alert('Error', 'Could not update estimate.');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async () => {
        Alert.alert(
            'Mark as Rejected?',
            'You can create a new estimate after this.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await updateDoc(estimateRef, {
                                status: 'rejected',
                            });
                        } catch (error) {
                            Alert.alert('Error', 'Could not update estimate.');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const handleSharePDF = async () => {
        const html = generatePDFHTML();
        try {
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });

            // Create a professional filename
            const clientName = (estimate?.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
            const estimateNum = estimate?.estimateNumber || 'Estimate';
            const newFileName = `Estimate-${estimateNum}_${clientName}.pdf`;
            const newUri = uri.replace(/[^/]+\.pdf$/, newFileName);

            // Rename the file (move to new path with better name)
            await FileSystem.moveAsync({ from: uri, to: newUri });

            await Sharing.shareAsync(newUri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Estimate',
            });
        } catch (error) {
            console.log('PDF error:', error);
            Alert.alert('Error', 'Could not generate PDF.');
        }
    };

    const generateShareToken = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const handleShareApprovalLink = async () => {
        if (!estimate) return;

        let token = estimate.shareToken;

        // Generate token if not exists
        if (!token) {
            setUpdating(true);
            token = generateShareToken();
            try {
                await updateDoc(estimateRef, { shareToken: token });
                // Update local state is handled by onSnapshot
            } catch (e) {
                setUpdating(false);
                return Alert.alert('Error', 'Could not generate share link.');
            } finally {
                setUpdating(false);
            }
        }

        const shareUrl = `https://contractorapp-5120d.web.app/estimate.html?projectId=${estimate.projectId}&estimateId=${estimateId}&t=${token}`;

        try {
            const { Share } = require('react-native');
            await Share.share({
                message: `Hello ${estimate.clientName}, please review and sign the estimate for "${estimate.projectTitle || 'your project'}" here: ${shareUrl}`,
                title: 'Review and Sign Estimate'
            });
        } catch (error) {
            Alert.alert('Error', 'Could not open share menu.');
        }
    };

    const handleSignature = async (signatureBase64: string) => {
        if (!user || !estimate) return;

        setIsSigning(true);
        setShowSignatureModal(false);

        try {
            // Upload signature to Cloudinary
            // Signature comes as base64 data URL
            const signatureUrl = await uploadToCloudinary(signatureBase64);

            if (!signatureUrl) {
                throw new Error('Failed to upload signature');
            }

            // Update Firestore
            await updateDoc(estimateRef, {
                status: 'approved',
                signatureUrl: signatureUrl,
                signedAt: serverTimestamp(),
            });

            Alert.alert('Contract Signed!', 'The estimate is now a signed contract and has been approved.');
        } catch (error) {
            console.log('[SIGNATURE] Error:', error);
            Alert.alert('Error', 'Could not save signature. Please try again.');
        } finally {
            setIsSigning(false);
        }
    };

    const generatePDFHTML = () => {
        // Company info from profile
        const companyName = companyProfile?.companyName || companyProfile?.company_name || 'Your Company';
        const companyPhone = companyProfile?.companyPhone || companyProfile?.phone || '';
        const companyEmail = companyProfile?.companyEmail || user?.email || '';
        const companyAddress = companyProfile?.companyAddress || companyProfile?.address || '';
        const contractorLicense = companyProfile?.contractorLicense || companyProfile?.license_number || '';
        const companyLogo = companyProfile?.companyLogo || companyProfile?.logoUrl || companyProfile?.logo_url || 'https://via.placeholder.com/80';
        const paymentInstructions = companyProfile?.paymentInstructions || companyProfile?.payment_instructions || 'Please contact for payment details.';

        const subtotal = estimate?.subtotal || 0;
        const taxRate = estimate?.taxRate || 0;
        const taxAmount = estimate?.taxAmount || 0;
        const discountAmount = estimate?.discount || estimate?.discountAmount || 0;
        const grandTotal = estimate?.total || estimate?.grandTotal || 0;
        const items = estimate?.items || [];
        const status = estimate?.status || 'draft';
        const notes = estimate?.notes || '';

        return `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { margin: 15mm 15mm; size: auto; }
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            color: #1e293b; 
            margin: 0; 
            padding: 0;
            line-height: 1.4;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          .container { max-width: 800px; margin: 0 auto; padding-bottom: 20px; }
          
          /* Header Section */
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .logo-container { display: flex; align-items: center; gap: 15px; }
          .logo { width: 60px; height: 60px; object-fit: contain; border-radius: 8px; }
          .company-name { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
          .company-info { font-size: 11px; color: #64748b; margin-top: 4px; }
          .company-info p { margin: 1px 0; }
          
          .doc-type { text-align: right; }
          .doc-title { font-size: 32px; font-weight: 800; color: #3b82f6; margin: 0; letter-spacing: -1px; }
          .doc-id { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .doc-date { font-size: 12px; color: #94a3b8; margin-top: 2px; }

          .accent-bar { height: 4px; background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%); margin-bottom: 25px; border-radius: 2px; }

          /* Address Section */
          .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 25px; }
          .address-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px; }
          .address-name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .address-content { font-size: 12px; color: #475569; }

          /* Items Table */
          table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; }
          th { background: #f8fafc; text-align: left; padding: 12px 15px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .item-name { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
          .item-desc { font-size: 10px; color: #64748b; }
          .qty { text-align: center; font-size: 12px; }
          .price, .total { text-align: right; font-size: 12px; font-weight: 500; }
          .total { font-weight: 600; color: #0f172a; }

          /* Summary Section */
          .summary-container { display: flex; justify-content: flex-end; margin-bottom: 25px; }
          .summary-table { width: 230px; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
          .summary-label { color: #64748b; }
          .summary-value { color: #1e293b; font-weight: 500; }
          .summary-divider { height: 1px; background: #e2e8f0; margin: 8px 0; }
          .grand-total { font-size: 19px; font-weight: 800; color: #10b981; }

          /* Notes & Instructions */
          .extra-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f8fafc; padding: 12px 15px; border-radius: 12px; border-left: 4px solid #3b82f6; }
          .info-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #3b82f6; margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
          .info-text { font-size: 11px; color: #475569; white-space: pre-wrap; margin: 0; }

          /* Signature Section */
          .signature-section { margin-top: 15px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .signature-box { width: 45%; position: relative; }
          .signature-line { border-bottom: 1.5px solid #cbd5e1; height: 45px; margin-bottom: 6px; position: relative; }
          .signature-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
          .signature-img { height: 50px; width: auto; position: absolute; bottom: 6px; left: 0; }
          .signature-date { font-size: 13px; font-weight: 600; color: #475569; position: absolute; bottom: 6px; left: 0; }

          /* Page Break Management */
          @media print {
            .no-break { break-inside: avoid; }
            body { background: none; }
            .container { padding-bottom: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              ${companyLogo ? `<img src="${companyLogo}" class="logo" />` : '<div style="width:60px;height:60px;background:#f1f5f9;border-radius:8px;"></div>'}
              <div>
                <h1 class="company-name">${companyName}</h1>
                <div class="company-info">
                  <p>${companyPhone}${companyEmail ? `  •  ${companyEmail}` : ''}</p>
                  <p>${companyAddress}</p>
                  ${contractorLicense ? `<p>License: ${contractorLicense}</p>` : ''}
                </div>
              </div>
            </div>
            <div class="doc-type">
              <h2 class="doc-title">${status === 'approved' ? 'CONTRACT' : 'ESTIMATE'}</h2>
              <div class="doc-id">#${estimate?.estimateNumber || '2025-001'}</div>
              <div class="doc-date">${formatDate(estimate?.createdAt)}</div>
            </div>
          </div>

          <div class="accent-bar"></div>

          <div class="addresses">
            <div>
              <div class="address-label">Bill To</div>
              <div class="address-name">${estimate?.clientName || 'Client Name'}</div>
              <div class="address-content">
                ${estimate?.clientEmail ? `<p style="margin:0">${estimate.clientEmail}</p>` : ''}
                ${estimate?.address ? `<p style="margin:2px 0 0 0">${estimate.address}</p>` : ''}
              </div>
            </div>
            <div>
              <div class="address-label">From</div>
              <div class="address-name">${companyName}</div>
              <div class="address-content">
                <p style="margin:0">${companyPhone}</p>
                <p style="margin:2px 0 0 0">${companyAddress}</p>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 55%">Description</th>
                <th style="width: 10%; text-align:center">Qty</th>
                <th style="width: 15%; text-align:right">Price</th>
                <th style="width: 20%; text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.description || ''}</div>
                  </td>
                  <td class="qty">${item.quantity}</td>
                  <td class="price">${formatCurrency(item.unitPrice)}</td>
                  <td class="total">${formatCurrency(item.total || (item.quantity * item.unitPrice))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-container no-break">
            <div class="summary-table">
              <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">${formatCurrency(subtotal)}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Tax (${taxRate}%)</span>
                <span class="summary-value">${formatCurrency(taxAmount)}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Discount</span>
                <span class="summary-value">-${formatCurrency(discountAmount)}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row" style="margin-top: 5px;">
                <span class="summary-label" style="font-weight: 700; color: #0f172a;">TOTAL</span>
                <span class="grand-total">${formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div class="extra-info no-break">
            <div class="info-box">
              <div class="info-title">💳 Payment Instructions</div>
              <p class="info-text">${paymentInstructions}</p>
            </div>
            <div class="info-box">
              <div class="info-title">📝 Notes & Terms</div>
              <p class="info-text">${notes || 'Standard terms and conditions apply.'}</p>
            </div>
          </div>

          <div class="signature-section no-break">
            <div class="signature-box">
              <div class="signature-line">
                ${estimate?.signatureUrl ? `<img src="${estimate.signatureUrl}" class="signature-img" />` : ''}
              </div>
              <div class="signature-label">Client Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                ${estimate?.signedAt && !isNaN(new Date(estimate.signedAt.toDate ? estimate.signedAt.toDate() : estimate.signedAt).getTime())
                ? `<span class="signature-date">${formatDate(estimate.signedAt)}</span>`
                : ''}
              </div>
              <div class="signature-label">Date signed</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const status: EstimateStatus = estimate?.status || 'draft';
    const items: LineItem[] = estimate?.items || [];

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{estimate?.estimateNumber}</Text>
                        <Text style={styles.headerSubtitle}>{estimate?.clientName}</Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* STATUS */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.statusSection}>
                        <View style={[styles.statusIconBg, { backgroundColor: `${getStatusColor(status)}20` }]}>
                            <Ionicons
                                name={status === 'approved' ? 'checkmark-circle' : status === 'rejected' ? 'close-circle' : 'time'}
                                size={36}
                                color={getStatusColor(status)}
                            />
                        </View>
                        <StatusBadge status={status} size="large" />
                        <Text style={styles.statusTitle}>{formatCurrency(estimate?.total)}</Text>
                        <Text style={styles.statusDate}>Created {formatDate(estimate?.createdAt)}</Text>
                    </Animated.View>

                    {/* CLIENT INFO */}
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoIcon}>
                                    <Ionicons name="person" size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Client</Text>
                                    <Text style={styles.infoValue}>{estimate?.clientName || 'N/A'}</Text>
                                </View>
                            </View>
                            {estimate?.clientEmail && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIcon}>
                                        <Ionicons name="mail" size={18} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>{estimate.clientEmail}</Text>
                                    </View>
                                </View>
                            )}
                            {estimate?.address && (
                                <View style={[styles.infoRow, { marginBottom: 0 }]}>
                                    <View style={styles.infoIcon}>
                                        <Ionicons name="location" size={18} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Address</Text>
                                        <Text style={styles.infoValue}>{estimate.address}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* LINE ITEMS */}
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Line Items ({items.length})</Text>
                        </View>
                        <View style={styles.itemsList}>
                            {items.map((item, index) => (
                                <View key={item.id || index} style={[styles.itemRow, index === items.length - 1 && { borderBottomWidth: 0 }]}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemDetails}>
                                            {item.quantity} {item.unit || 'x'} @ {formatCurrency(item.unitPrice)}
                                        </Text>
                                    </View>
                                    <Text style={styles.itemTotal}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* TOTALS */}
                    <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                        <View style={styles.totalsCard}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>{formatCurrency(estimate?.subtotal)}</Text>
                            </View>
                            {estimate?.taxRate > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Tax ({estimate.taxRate}%)</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(estimate?.taxAmount)}</Text>
                                </View>
                            )}
                            {estimate?.discount > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Discount</Text>
                                    <Text style={styles.totalValue}>-{formatCurrency(estimate?.discount)}</Text>
                                </View>
                            )}
                            <View style={styles.divider} />
                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>Total</Text>
                                <Text style={styles.grandTotalValue}>{formatCurrency(estimate?.total)}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* NOTES */}
                    {estimate?.notes && (
                        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
                            <Text style={styles.sectionTitle}>Notes</Text>
                            <View style={styles.notesCard}>
                                <Text style={styles.notesText}>{estimate.notes}</Text>
                            </View>
                        </Animated.View>
                    )}
                    {/* SIGNATURE SECTION IN VIEW */}
                    {estimate?.signatureUrl && (
                        <Animated.View entering={FadeInDown.delay(600)} style={[styles.section, { paddingHorizontal: SPACING.m, marginBottom: 100 }]}>
                            <Text style={styles.sectionTitle}>Client Signature</Text>
                            <View style={styles.signatureCard}>
                                <Image
                                    source={{ uri: estimate.signatureUrl }}
                                    style={styles.signatureImage}
                                    contentFit="contain"
                                />
                                <Text style={styles.signatureDate}>Signed on {formatDate(estimate.signedAt)}</Text>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleSharePDF}>
                            <Ionicons name="document-text-outline" size={18} color={COLORS.text} />
                            <Text style={styles.actionBtnText}>Share PDF</Text>
                        </TouchableOpacity>
                        {projectStatus !== 'archived' && (
                            <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.primary }]} onPress={handleShareApprovalLink}>
                                <Ionicons name="link-outline" size={18} color={COLORS.primary} />
                                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Share Link</Text>
                            </TouchableOpacity>
                        )}
                        {status === 'waiting' && (
                            <TouchableOpacity style={styles.actionBtn} onPress={handleReject}>
                                <Ionicons name="close" size={18} color={COLORS.accent} />
                                <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>Reject</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {status === 'waiting' && (
                        <View style={{ gap: 10 }}>
                            <TouchableOpacity onPress={() => setShowSignatureModal(true)} disabled={updating || isSigning}>
                                <LinearGradient
                                    colors={GRADIENTS.primary as [string, string]}
                                    style={styles.approveBtn}
                                >
                                    {isSigning ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <>
                                            <Ionicons name="create-outline" size={22} color={COLORS.white} />
                                            <Text style={styles.approveBtnText}>Sign Contract</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleApprove} disabled={updating || isSigning}>
                                <View style={[styles.approveBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#10B981' }]}>
                                    <Text style={[styles.approveBtnText, { color: '#10B981', fontSize: 13 }]}>Mark Approved (No Signature)</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <SignatureModal
                    visible={showSignatureModal}
                    onClose={() => setShowSignatureModal(false)}
                    onOK={handleSignature}
                />
            </SafeAreaView>
        </View>
    );
}
