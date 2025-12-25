import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { SPACING, RADIUS, FONT_SIZES, SHADOWS, THEMES } from '../../theme/DesignSystem';
import { getStyles } from './WelcomeScreen.styles';

export default function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  // We always use the dark theme colors for the Welcome screen to maintain its premium aesthetic
  // even if the rest of the app is in light mode.
  const styles = getStyles(THEMES.dark.colors, SPACING, RADIUS, FONT_SIZES, SHADOWS);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Fondo de imagen (puedes cambiar la URL o usar un require local) */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2531&auto=format&fit=crop' }}
        style={styles.background}
      >
        <LinearGradient
          colors={['transparent', 'rgba(10, 15, 26, 0.8)', '#0A0F1A']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Projectley</Text>
            <Text style={styles.subtitle}>
              Manage projects, track your crew, and scale your business with ease.
            </Text>

            <View style={styles.buttonContainer}>
              {/* Botón: GET STARTED -> Va a Registro (SignUp) */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>

              {/* Botón: I ALREADY HAVE AN ACCOUNT -> Va a Login */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.secondaryButtonText}>I already have an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}