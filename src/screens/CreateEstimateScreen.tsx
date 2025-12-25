import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc,
} from 'firebase/firestore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { auth } from '../services/firebase';
import { COLORS_WARM as COLORS, GRADIENTS_WARM as GRADIENTS } from '../theme/DesignSystem';
import { LineItemRow } from '../components/LineItemRow';
import { styles } from '../styles/CreateEstimateScreen.styles';

interface LineItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
}

interface Service {
    id: string;
    name: string;
    description?: string;
    unitPrice: number;
    unit?: string;
    category?: string;
}

export default function CreateEstimateScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { projectId, project, existingEstimate } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<LineItem | null>(null);

    // Line Items
    const [items, setItems] = useState<LineItem[]>([]);

    // Totals
    const [taxRate, setTaxRate] = useState('0');
    const [discount, setDiscount] = useState('0');
    const [notes, setNotes] = useState('Thank you for your business!');

    // Saved Services
    const [services, setServices] = useState<Service[]>([]);

    // Company Profile for PDF branding
    const [companyProfile, setCompanyProfile] = useState<any>(null);

    // Modals
    const [showAddItem, setShowAddItem] = useState(false);
    const [showServicePicker, setShowServicePicker] = useState(false);

    // New item form
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('1');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [saveAsService, setSaveAsService] = useState(false);

    const db = getFirestore();
    const user = auth.currentUser;

    // Load saved services (one-time fetch, not real-time - saves Firebase reads)
    useEffect(() => {
        if (!user) return;

        const fetchServices = async () => {
            try {
                const servicesQuery = query(
                    collection(db, 'services'),
                    where('userId', '==', user.uid)
                );
                const snap = await getDocs(servicesQuery);
                const servicesList: Service[] = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Service));
                // Sort by name client-side
                servicesList.sort((a, b) => a.name.localeCompare(b.name));
                setServices(servicesList);
            } catch (error) {
                console.log('Services fetch error:', error);
                setServices([]);
            }
        };

        fetchServices();
    }, [user, db]);

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

    // Load existing estimate for edit mode
    useEffect(() => {
        if (existingEstimate) {
            setIsEditMode(true);
            setEditingEstimateId(existingEstimate.id);

            // Load items
            if (existingEstimate.items) {
                setItems(existingEstimate.items);
            }

            // Load other fields
            if (existingEstimate.taxRate !== undefined) {
                setTaxRate(String(existingEstimate.taxRate));
            }
            if (existingEstimate.discount !== undefined) {
                setDiscount(String(existingEstimate.discount));
            }
            if (existingEstimate.notes) {
                setNotes(existingEstimate.notes);
            }
        }
    }, [existingEstimate]);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (parseFloat(taxRate) / 100 || 0);
    const discountAmount = parseFloat(discount) || 0;
    const grandTotal = subtotal + taxAmount - discountAmount;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Generate estimate number
    const generateEstimateNumber = async () => {
        if (!user) return 'EST-001';

        const estimatesRef = collection(db, 'estimates');
        const q = query(estimatesRef, where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const count = snap.size + 1;
        const year = new Date().getFullYear();
        return `EST-${year}-${count.toString().padStart(3, '0')}`;
    };

    // Add or Update item from form
    const handleAddItem = () => {
        if (!newItemName.trim() || !newItemPrice.trim()) {
            return Alert.alert('Missing Info', 'Name and price are required.');
        }

        if (editingItem) {
            // Update existing item
            const updatedItems = items.map(item =>
                item.id === editingItem.id
                    ? {
                        ...item,
                        name: newItemName.trim(),
                        description: newItemDesc.trim() || undefined,
                        quantity: parseFloat(newItemQty) || 1,
                        unitPrice: parseFloat(newItemPrice) || 0,
                        unit: newItemUnit.trim() || undefined,
                    }
                    : item
            );
            setItems(updatedItems);
        } else {
            // Add new item
            const newItem: LineItem = {
                id: Date.now().toString(),
                name: newItemName.trim(),
                description: newItemDesc.trim() || undefined,
                quantity: parseFloat(newItemQty) || 1,
                unitPrice: parseFloat(newItemPrice) || 0,
                unit: newItemUnit.trim() || undefined,
            };
            setItems([...items, newItem]);

            // Save as service if checked (only for new items)
            if (saveAsService) {
                handleSaveItemAsService(newItem);
            }
        }

        setShowAddItem(false);
        resetNewItemForm();
    };

    const handleEditItem = (item: LineItem) => {
        setEditingItem(item);
        setNewItemName(item.name);
        setNewItemQty(String(item.quantity));
        setNewItemPrice(String(item.unitPrice));
        setNewItemUnit(item.unit || '');
        setNewItemDesc(item.description || '');
        setShowAddItem(true);
    };

    // Save item as a reusable service
    const handleSaveItemAsService = async (item: LineItem) => {
        if (!user) return;

        try {
            await addDoc(collection(db, 'services'), {
                userId: user.uid,
                name: item.name,
                description: item.description || '',
                unitPrice: item.unitPrice,
                unit: item.unit || '',
                category: 'Custom',
                createdAt: serverTimestamp(),
            });

            // Refresh services list
            const servicesQuery = query(
                collection(db, 'services'),
                where('userId', '==', user.uid)
            );
            const servicesSnap = await getDocs(servicesQuery);
            const servicesData = servicesSnap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Service[];
            setServices(servicesData.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (e) {
            console.log('Error saving service:', e);
        }
    };

    // Add from saved service
    const handleAddFromService = (service: Service) => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            name: service.name,
            description: service.description,
            quantity: 1,
            unitPrice: service.unitPrice,
            unit: service.unit,
        };

        setItems([...items, newItem]);
        setShowServicePicker(false);
    };

    const handleImportFromProject = () => {
        if (!project?.jobItems || project.jobItems.length === 0) {
            return Alert.alert('No Items', 'This project does not have any job items to import.');
        }

        const importedItems: LineItem[] = project.jobItems.map((item: any, idx: number) => ({
            id: `import-${idx}-${Date.now()}`,
            name: item.label,
            quantity: 1,
            unitPrice: 0,
        }));

        setItems([...items, ...importedItems]);
        Alert.alert('Imported', `${importedItems.length} items imported from project description.`);
    };

    const resetNewItemForm = () => {
        setNewItemName('');
        setNewItemQty('1');
        setNewItemPrice('');
        setNewItemUnit('');
        setNewItemDesc('');
        setSaveAsService(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (itemId: string) => {
        setItems(items.filter(item => item.id !== itemId));
    };

    // Clean items to remove undefined values (Firebase doesn't accept undefined)
    const cleanItemsForFirebase = (itemsList: LineItem[]) => {
        return itemsList.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit || '',
        }));
    };

    // Save as draft (or update existing)
    const handleSaveDraft = async () => {
        if (!user) return Alert.alert('Error', 'Please login again.');
        if (items.length === 0) return Alert.alert('No Items', 'Add at least one item to save.');

        setSaving(true);
        try {
            const cleanedItems = cleanItemsForFirebase(items);

            if (isEditMode && editingEstimateId) {
                // Update existing estimate
                const estimateRef = doc(db, 'estimates', editingEstimateId);
                await updateDoc(estimateRef, {
                    items: cleanedItems,
                    subtotal,
                    taxRate: parseFloat(taxRate) || 0,
                    taxAmount,
                    discount: discountAmount,
                    total: grandTotal,
                    notes: notes || '',
                    updatedAt: serverTimestamp(),
                    // Clear signature if updated (modified content needs new signature)
                    signatureUrl: null,
                    signedAt: null,
                    approvedAt: null,
                });

                Alert.alert('Updated!', 'Estimate has been updated.', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                // Create new estimate
                const estimateNumber = await generateEstimateNumber();

                await addDoc(collection(db, 'estimates'), {
                    projectId: projectId || '',
                    userId: user.uid,
                    estimateNumber,
                    status: 'draft',
                    clientName: project?.client || '',
                    clientEmail: project?.clientEmail || '',
                    clientPhone: project?.clientPhone || '',
                    address: project?.address || '',
                    items: cleanedItems,
                    subtotal,
                    taxRate: parseFloat(taxRate) || 0,
                    taxAmount,
                    discount: discountAmount,
                    total: grandTotal,
                    notes: notes || '',
                    createdAt: serverTimestamp(),
                    sentAt: null,
                });

                Alert.alert('Saved!', 'Estimate saved as draft.', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            console.error('Error saving estimate:', error);
            Alert.alert('Error', 'Could not save estimate.');
        } finally {
            setSaving(false);
        }
    };

    // Send to client - Streamlined Flow
    const handleSendEstimate = async () => {
        if (!user) return Alert.alert('Error', 'Please login again.');
        if (items.length === 0) return Alert.alert('No Items', 'Add at least one item.');

        // Streamlined: Auto-save as waiting and open share menu
        Alert.alert(
            'Send Estimate',
            'This will mark the estimate as "Waiting" and share the secure link with your client. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Link',
                    onPress: async () => {
                        const result = await saveEstimateToFirebase('waiting');
                        if (result?.id && result?.shareToken) {
                            handleShareApprovalLink(result.id, result.shareToken);
                        }
                    }
                }
            ]
        );
    };

    const handleShareApprovalLink = async (estimateId: string, token: string) => {
        const shareUrl = `https://contractorapp-5120d.web.app/estimate.html?projectId=${projectId}&estimateId=${estimateId}&t=${token}`;

        try {
            const { Share } = require('react-native');
            await Share.share({
                message: `Please review and approve the estimate for our project "${project?.name || 'Project'}": ${shareUrl}`,
                title: 'Estimate Approval Link'
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Could not open share menu.');
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

    // Save estimate to Firebase (or update existing)
    const saveEstimateToFirebase = async (status: 'draft' | 'waiting') => {
        if (!user) return null;

        setLoading(true);
        try {
            const cleanedItems = cleanItemsForFirebase(items);

            if (isEditMode && editingEstimateId) {
                // Update existing estimate
                const estimateRef = doc(db, 'estimates', editingEstimateId);
                const shareToken = existingEstimate?.shareToken || generateShareToken();

                await updateDoc(estimateRef, {
                    status,
                    items: cleanedItems,
                    subtotal,
                    taxRate: parseFloat(taxRate) || 0,
                    taxAmount,
                    discount: discountAmount,
                    total: grandTotal,
                    notes: notes || '',
                    updatedAt: serverTimestamp(),
                    sentAt: status === 'waiting' ? serverTimestamp() : null,
                    shareToken,
                    // Clear signature if updated
                    signatureUrl: null,
                    signedAt: null,
                    approvedAt: null,
                });

                if (status === 'draft') {
                    Alert.alert('Updated!', 'Estimate updated as draft.', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                }

                setLoading(false);
                return { id: editingEstimateId, shareToken };
            } else {
                // Create new estimate
                const estimateNumber = await generateEstimateNumber();
                const shareToken = generateShareToken();

                const docRef = await addDoc(collection(db, 'estimates'), {
                    projectId: projectId || '',
                    userId: user.uid,
                    estimateNumber,
                    status,
                    clientName: project?.client || '',
                    clientEmail: project?.clientEmail || '',
                    clientPhone: project?.clientPhone || '',
                    address: project?.address || '',
                    items: cleanedItems,
                    subtotal,
                    taxRate: parseFloat(taxRate) || 0,
                    taxAmount,
                    discount: discountAmount,
                    total: grandTotal,
                    notes: notes || '',
                    shareToken,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    sentAt: status === 'waiting' ? serverTimestamp() : null,
                });

                // Upgrade project with shareToken if missing (for older projects)
                if (projectId && !project?.shareToken) {
                    try {
                        const projectRef = doc(db, 'projects', projectId);
                        await updateDoc(projectRef, { shareToken: generateShareToken() });
                    } catch (err) {
                        console.error('Failed to upgrade project with shareToken:', err);
                    }
                }

                if (status === 'draft') {
                    Alert.alert('Success', 'Estimate saved as draft!', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                }

                setLoading(false);
                return { id: docRef.id, shareToken };
            }
        } catch (error) {
            console.error('Error saving estimate:', error);
            Alert.alert('Error', 'Could not save estimate.');
            setLoading(false);
            return null;
        }
    };

    // Preview PDF only (for the Preview button)
    const handlePreviewPDF = async () => {
        if (items.length === 0) return Alert.alert('No Items', 'Add at least one item to preview.');

        // Generate fresh HTML each time
        const html = generatePDFHTML();

        try {
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Estimate',
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Could not generate PDF.');
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
              <h2 class="doc-title">ESTIMATE</h2>
              <div class="doc-id">#${existingEstimate?.estimateNumber || 'NEW'}</div>
              <div class="doc-date">${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="accent-bar"></div>

          <div class="addresses">
            <div>
              <div class="address-label">Bill To</div>
              <div class="address-name">${project?.client || 'Client Name'}</div>
              <div class="address-content">
                ${project?.clientEmail ? `<p style="margin:0">${project.clientEmail}</p>` : ''}
                ${project?.address ? `<p style="margin:2px 0 0 0">${project.address}</p>` : ''}
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
              ${items.map(item => `
                <tr>
                  <td>
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.description || ''}</div>
                  </td>
                  <td class="qty">${item.quantity}</td>
                  <td class="price">${formatCurrency(item.unitPrice)}</td>
                  <td class="total">${formatCurrency(item.quantity * item.unitPrice)}</td>
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
              <div class="signature-line"></div>
              <div class="signature-label">Client Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Date signed</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color={COLORS.text} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>{isEditMode ? 'Edit Estimate' : 'New Estimate'}</Text>
                            <Text style={styles.headerSubtitle}>{project?.name || 'Project'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft} disabled={saving}>
                        <Text style={styles.saveDraftText}>{saving ? 'Saving...' : 'Save Draft'}</Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        automaticallyAdjustKeyboardInsets={true}
                    >
                        {/* CLIENT INFO */}
                        <Animated.View entering={FadeInDown.delay(100)}>
                            <View style={styles.clientCard}>
                                <Text style={styles.clientLabel}>Bill To</Text>
                                <Text style={styles.clientName}>{project?.client || 'Client Name'}</Text>
                                {project?.clientEmail && (
                                    <Text style={styles.clientEmail}>{project.clientEmail}</Text>
                                )}
                                {project?.address && (
                                    <Text style={styles.clientEmail}>{project.address}</Text>
                                )}
                            </View>

                            {/* JOB DESCRIPTION */}
                            {project?.description && (
                                <View style={styles.descriptionCard}>
                                    <Text style={styles.descriptionTitle}>Job Description</Text>
                                    <Text style={styles.descriptionText}>{project.description}</Text>
                                </View>
                            )}
                        </Animated.View>

                        {/* LINE ITEMS */}
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Line Items</Text>
                                <View style={styles.addItemActions}>
                                    <TouchableOpacity
                                        style={styles.addItemBtn}
                                        onPress={handleImportFromProject}
                                    >
                                        <Ionicons name="list" size={14} color={COLORS.primary} />
                                        <Text style={styles.addItemText}>Import Job List</Text>
                                    </TouchableOpacity>
                                    {services.length > 0 && (
                                        <TouchableOpacity
                                            style={styles.addItemBtn}
                                            onPress={() => setShowServicePicker(true)}
                                        >
                                            <Ionicons name="flash" size={14} color={COLORS.primary} />
                                            <Text style={styles.addItemText}>Quick Add</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.addItemBtn}
                                        onPress={() => setShowAddItem(true)}
                                    >
                                        <Ionicons name="add" size={16} color={COLORS.primary} />
                                        <Text style={styles.addItemText}>Add Item</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {items.length === 0 ? (
                                <View style={styles.emptyItems}>
                                    <View style={styles.emptyIcon}>
                                        <Ionicons name="list-outline" size={24} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.emptyText}>No items yet. Tap "Add Item" to start.</Text>
                                </View>
                            ) : (
                                items.map((item) => (
                                    <LineItemRow
                                        key={item.id}
                                        item={item}
                                        onEdit={() => handleEditItem(item)}
                                        onDelete={() => handleDeleteItem(item.id)}
                                    />
                                ))
                            )}
                        </Animated.View>

                        {/* TOTALS */}
                        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                            <Text style={styles.sectionTitle}>Summary</Text>
                            <View style={styles.totalsCard}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Subtotal</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                                </View>

                                <View style={styles.totalRow}>
                                    <View style={styles.taxRow}>
                                        <Text style={styles.totalLabel}>Tax</Text>
                                        <TextInput
                                            style={styles.taxInput}
                                            value={taxRate}
                                            onChangeText={setTaxRate}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textDim}
                                        />
                                        <Text style={styles.taxSymbol}>%</Text>
                                    </View>
                                    <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
                                </View>

                                <View style={styles.totalRow}>
                                    <View style={styles.taxRow}>
                                        <Text style={styles.totalLabel}>Discount</Text>
                                        <Text style={styles.taxSymbol}>$</Text>
                                        <TextInput
                                            style={styles.taxInput}
                                            value={discount}
                                            onChangeText={setDiscount}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textDim}
                                        />
                                    </View>
                                    <Text style={styles.totalValue}>-{formatCurrency(discountAmount)}</Text>
                                </View>

                                <View style={styles.totalDivider} />

                                <View style={styles.grandTotalRow}>
                                    <Text style={styles.grandTotalLabel}>Total</Text>
                                    <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* NOTES */}
                        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Notes & Terms</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Add any notes, terms, or conditions..."
                                    placeholderTextColor={COLORS.textDim}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.previewBtn} onPress={handlePreviewPDF}>
                            <Ionicons name="eye-outline" size={18} color={COLORS.text} />
                            <Text style={styles.previewBtnText}>Preview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSendEstimate} disabled={loading}>
                            <LinearGradient
                                colors={GRADIENTS.primary as [string, string]}
                                style={styles.sendBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons name="send" size={18} color={COLORS.white} />
                                        <Text style={styles.sendBtnText}>Send Estimate</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {/* ADD ITEM MODAL */}
            <Modal visible={showAddItem} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit Line Item' : 'Add Line Item'}</Text>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAddItem(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Item name"
                            placeholderTextColor={COLORS.textDim}
                            value={newItemName}
                            onChangeText={setNewItemName}
                        />
                        <TextInput
                            style={[styles.modalInput, styles.modalTextArea]}
                            placeholder="Description (optional)"
                            placeholderTextColor={COLORS.textDim}
                            value={newItemDesc}
                            onChangeText={setNewItemDesc}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TextInput
                                style={[styles.modalInput, { flex: 1 }]}
                                placeholder="Qty"
                                placeholderTextColor={COLORS.textDim}
                                value={newItemQty}
                                onChangeText={setNewItemQty}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={[styles.modalInput, { flex: 1 }]}
                                placeholder="Unit (sq ft)"
                                placeholderTextColor={COLORS.textDim}
                                value={newItemUnit}
                                onChangeText={setNewItemUnit}
                            />
                            <TextInput
                                style={[styles.modalInput, { flex: 1 }]}
                                placeholder="Price"
                                placeholderTextColor={COLORS.textDim}
                                value={newItemPrice}
                                onChangeText={setNewItemPrice}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Save as Service checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setSaveAsService(!saveAsService)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, saveAsService && styles.checkboxChecked]}>
                                {saveAsService && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                            </View>
                            <Text style={styles.checkboxLabel}>Save as Service for quick add</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleAddItem}>
                            <LinearGradient
                                colors={GRADIENTS.primary as [string, string]}
                                style={styles.modalBtn}
                            >
                                <Text style={styles.modalBtnText}>{editingItem ? 'Update Item' : 'Add Item'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* SERVICE PICKER MODAL */}
            <Modal visible={showServicePicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Quick Add from Services</Text>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowServicePicker(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            {services.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                    <Text style={{ color: COLORS.textMuted }}>No saved services yet.</Text>
                                    <Text style={{ color: COLORS.textDim, fontSize: 12, marginTop: 4 }}>
                                        Add services in Settings to quick add here.
                                    </Text>
                                </View>
                            ) : (
                                services.map((service) => (
                                    <TouchableOpacity
                                        key={service.id}
                                        style={styles.serviceItem}
                                        onPress={() => handleAddFromService(service)}
                                    >
                                        <View style={styles.serviceInfo}>
                                            <Text style={styles.serviceName}>{service.name}</Text>
                                            <Text style={styles.servicePrice}>
                                                {formatCurrency(service.unitPrice)} / {service.unit || 'each'}
                                            </Text>
                                        </View>
                                        <View style={styles.serviceAddBtn}>
                                            <Ionicons name="add" size={20} color={COLORS.primary} />
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
