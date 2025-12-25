import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { onIdTokenChanged, User, reload } from 'firebase/auth';
import { auth } from './src/services/firebase';

// Importamos tus navegadores
import AuthNavigator from './src/navigation/AuthNavigator';
import VerificationScreen from './src/screens/auth/VerificationScreen';
import MainNavigator from './src/navigation/MainNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Función simple para actualizar estado
  const updateUserData = (currentUser: User | null) => {
    if (currentUser) {
      setUser({ ...currentUser } as User);
    } else {
      setUser(null);
    }
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const subscriber = onIdTokenChanged(auth, (currentUser) => {
      updateUserData(currentUser);
    });

    const appStateListener = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && auth.currentUser) {
        if (!auth.currentUser.emailVerified) {
          try {
            console.log("App activa y usuario no verificado: Recargando perfil...");
            await reload(auth.currentUser);
            updateUserData(auth.currentUser);
          } catch (e) {
            console.log("Error recargando usuario en background switch", e);
          }
        }
      }
    });

    return () => {
      subscriber();
      appStateListener.remove();
    };
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar style="auto" />

        {!user ? (
          <AuthNavigator />
        ) : !user.emailVerified ? (
          <VerificationScreen />
        ) : (
          <MainNavigator />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
}