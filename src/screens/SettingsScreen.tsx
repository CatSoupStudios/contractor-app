import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles/SettingsScreen.styles';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => await signOut(auth)
        }
      ]
    );
  };

  // Componente para cada Fila de opción
  const SettingItem = ({ icon, title, isDestructive = false, onPress }: any) => (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, isDestructive && styles.destructiveIconBox]}>
          <Ionicons name={icon} size={22} color={isDestructive ? '#ef4444' : '#fff'} />
        </View>
        <Text style={[styles.itemText, isDestructive && styles.destructiveText]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER TIPO MODAL */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>

        {/* SECCIÓN 1: CUENTA */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <SettingItem icon="person-outline" title="Edit Profile" onPress={() => console.log("Profile")} />
          <View style={styles.separator} />
          <SettingItem icon="notifications-outline" title="Notifications" onPress={() => console.log("Notif")} />
          <View style={styles.separator} />
          <SettingItem icon="language-outline" title="Language" onPress={() => console.log("Lang")} />
        </View>

        {/* SECCIÓN 2: SOPORTE */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.section}>
          <SettingItem icon="help-buoy-outline" title="Help Center" onPress={() => console.log("Help")} />
          <View style={styles.separator} />
          <SettingItem icon="document-text-outline" title="Terms & Privacy" onPress={() => console.log("Terms")} />
        </View>

        {/* SECCIÓN 3: ZONA DE PELIGRO */}
        <View style={styles.section}>
          <SettingItem
            icon="log-out-outline"
            title="Log Out"
            isDestructive={true}
            onPress={handleLogout}
          />
        </View>

        <Text style={styles.versionText}>Version 1.0.0 (Beta)</Text>

      </ScrollView>
    </View>
  );
}