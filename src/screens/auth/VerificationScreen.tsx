import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  BackHandler,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendEmailVerification, reload, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './VerificationScreen.styles';

export default function VerificationScreen() {
  const { currentTheme, isDark } = useTheme();
  const { colors: COLORS } = currentTheme;
  const styles = getStyles(COLORS);
  const [isVerified, setIsVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutos

  // 1. Bloquear botón atrás
  useEffect(() => {
    const onBackPress = () => true;
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  // 1.1 Timer para Reenviar
  useEffect(() => {
    if (countdown > 0) {
      const timerId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [countdown]);

  // 2. ENVIAR CORREO + DETECTAR VERIFICACIÓN (ESTO FALTABA)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const initialProcess = async () => {
      // A) ENVIAR EL CORREO AUTOMÁTICAMENTE
      try {
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          console.log("📧 Enviando correo de verificación...");
          await sendEmailVerification(auth.currentUser);
          console.log("✅ Correo enviado.");
        }
      } catch (error: any) {
        // Si falla por "too-many-requests" no molestamos, si es red avisamos consola
        console.log("Estado del envío:", error.code);
      }

      // B) INICIAR EL CHEQUEO AUTOMÁTICO
      interval = setInterval(checkVerification, 3000);
    };

    const checkVerification = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          await reload(user); // Recargar usuario de Firebase
          if (user.emailVerified) {
            console.log("✅ ¡Verificado!");
            setIsVerified(true);
            await user.getIdToken(true); // Avisar a la App
          }
        }
      } catch (e) { console.log(e); }
    };

    // Ejecutar todo
    initialProcess();

    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') checkVerification();
    });

    return () => {
      if (interval) clearInterval(interval);
      appStateListener.remove();
    };
  }, []);

  // --- BOTÓN MANUAL (Continuar) ---
  const handleContinue = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await reload(user);
        if (user.emailVerified) {
          await user.getIdToken(true);
        } else {
          Alert.alert("Not Verified", "Please check your email and click the link.");
        }
      }
    } catch (e) { console.log(e); }
  };

  // --- BOTÓN REENVIAR (Resend) ---
  const handleResend = async () => {
    setSending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Sent!", "Email sent again. Check your inbox.");
        setCountdown(120); // Reset timer
      }
    } catch (e: any) {
      if (e.code === 'auth/too-many-requests') {
        Alert.alert("Wait", "Please wait a minute before resending.");
      } else {
        Alert.alert("Error", e.message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // VISTA DE ÉXITO
  if (isVerified) {
    return (
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: COLORS.surface }]}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Email Verified!</Text>
        <Text style={styles.description}>You are ready.</Text>
        <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
          <Text style={styles.continueText}>Continue to App</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    );
  }

  // VISTA DE ESPERA
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-unread-outline" size={80} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Verify your Email</Text>
      <Text style={styles.description}>
        We sent a link to: <Text style={{ fontWeight: 'bold', color: COLORS.text }}>{auth.currentUser?.email}</Text>
      </Text>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Waiting...</Text>
      </View>

      {countdown > 0 ? (
        <View style={styles.resendButton}>
          <Text style={[styles.resendText, { opacity: 0.6 }]}>
            You can resend in {formatTime(countdown)}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleResend}
          style={[styles.resendButton, sending && { opacity: 0.5 }]}
          disabled={sending}
        >
          <Text style={styles.resendText}>{sending ? "Sending..." : "Resend Email"}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Wrong email? Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
