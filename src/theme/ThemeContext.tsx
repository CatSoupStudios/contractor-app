
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from './DesignSystem';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    currentTheme: typeof THEMES.dark;
    themeType: ThemeType;
    themeKey: number; // Force re-render key
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeType, setThemeType] = useState<ThemeType>('light'); // 'light' is the Construction Blue (WARM)
    const [themeKey, setThemeKey] = useState(0); // Key to force full re-render

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('@theme_preference');
            if (savedTheme) {
                setThemeType(savedTheme as ThemeType);
            }
        } catch (error) {
            console.log('[THEME_CONTEXT] Error loading theme:', error);
        }
    };

    const toggleTheme = async () => {
        const newTheme = themeType === 'light' ? 'dark' : 'light';
        try {
            await AsyncStorage.setItem('@theme_preference', newTheme);
            setThemeType(newTheme);
            // Increment key to force all components to re-mount
            setThemeKey(prev => prev + 1);
            console.log(`[THEME] Switched to ${newTheme} mode 🎨`);
        } catch (error) {
            console.log('[THEME_CONTEXT] Error changing theme:', error);
            setThemeType(newTheme);
            setThemeKey(prev => prev + 1);
        }
    };

    const value = {
        isDark: themeType === 'dark',
        toggleTheme,
        currentTheme: themeType === 'dark' ? THEMES.dark : THEMES.light,
        themeType,
        themeKey,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
